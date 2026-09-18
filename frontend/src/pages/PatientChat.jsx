import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../api'
import { Button, Spinner } from '../ui'

const STARTERS = [
  'I have had chest pain for two days. What could it be?',
  'My child has had a fever for 3 days.',
  'I noticed a new mole on my arm. Should I worry?',
  'I have a headache and blurred vision this morning.',
]

function ThinkingBlock({ text }) {
  const [open, setOpen] = useState(false)
  if (!text) return null
  return (
    <div className="thinking">
      <button type="button" className="thinking-toggle" onClick={() => setOpen(o => !o)}>
        <span className={'chevron ' + (open ? 'open' : '')}>▸</span>
        {open ? 'Hide reasoning' : 'Show reasoning'}
        <span className="thinking-meta">({text.length} chars)</span>
      </button>
      {open && <pre className="thinking-body">{text}</pre>}
    </div>
  )
}

function Bubble({ m }) {
  // ponytail: onError fallback swaps a blob: or broken src for a small
  // "image" placeholder chip so the user knows the upload exists even when
  // /uploads/<id> 502s (Vite proxy timeout, Flask restart, etc.).
  if (m.role === 'patient') {
    return (
      <div className="bubble bubble-you">
        {m.image_url && (
          <img src={m.image_url} alt=""
               onError={e => {
                 e.currentTarget.style.display = 'none';
                 const chip = e.currentTarget.nextElementSibling;
                 if (chip && chip.classList.contains('attach-fallback')) {
                   chip.style.display = 'inline-flex';
                 }
               }} />
        )}
        {m.image_url && (
          <span className="attach-fallback" style={{ display: 'none' }}>image</span>
        )}
        <div>{m.content}</div>
      </div>
    )
  }
  return (
    <div className="bubble bubble-agent">
      <div>{m.content || '(no answer)'}</div>
      <ThinkingBlock text={m.thinking} />
      {m.agent && <div className="bubble-meta">via {m.agent}</div>}
    </div>
  )
}

export default function PatientChat() {
  const [threads, setThreads] = useState([])
  const [active, setActive] = useState('new')
  const [conv, setConv] = useState(null)
  const [input, setInput] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)  // blob: URL for composer preview
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  // ponytail: when send() loads the new conversation itself, mark the next
  // active-change as "already loaded" so the effect doesn't double-fetch.
  const skipNextLoadRef = useRef(false)

  useEffect(() => { loadThreads() }, [])
  useEffect(() => {
    if (active && active !== 'new') {
      if (skipNextLoadRef.current) { skipNextLoadRef.current = false; return }
      loadConv(active).catch(() => {})
    } else {
      setConv(null)
    }
  }, [active])

  async function loadThreads() {
    try { setThreads(await apiFetch('/chat/conversations')) }
    catch (e) { setErr(e.message) }
  }

  async function loadConv(id) {
    try { setConv(await apiFetch('/chat/conversations/' + id)) }
    catch (e) { setErr(e.message) }
  }

  async function send(text) {
    const txt = (text ?? input).trim()
    if (!txt && !image) return
    setBusy(true); setErr('')

    // ponytail: keep a blob: URL around as a fallback preview. If the upload
    // fails for any reason the optimistic bubble still shows the user's image.
    const blobUrl = image ? URL.createObjectURL(image) : null

    let uploaded = null
    if (image) {
      try {
        const fd = new FormData()
        fd.append('file', image)
        uploaded = await apiFetch('/chat/upload', { method: 'POST', body: fd })
        console.log('[chat] upload ok', uploaded)
      } catch (e) {
        console.error('[chat] upload failed', e)
        setErr('upload failed: ' + e.message)
        setBusy(false)
        return
      }
    } else {
      console.log('[chat] send without image, image state:', image)
    }

    const useExisting = active !== 'new'
    // ponytail: optimistically append the patient bubble so the user sees their
    // own message immediately. Prefer the server URL (survives reload); fall
    // back to the blob URL if upload failed.
    const previewUrl = uploaded?.url || blobUrl
    setConv(prev => {
      const base = prev || { _id: null, messages: [] }
      const newBubble = { role: 'patient', content: txt, image_url: previewUrl,
                          ts: new Date().toISOString() }
      console.log('[chat] optimistic bubble:', newBubble)
      return {
        ...base,
        messages: [...(base.messages || []), newBubble],
      }
    })

    try {
      const body = uploaded
        ? { text: txt, image_file_id: uploaded.file_id, conversation_id: useExisting ? active : undefined }
        : { text: txt, conversation_id: useExisting ? active : undefined }
      const resp = await apiFetch('/chat', { method: 'POST', body: JSON.stringify(body) })
      skipNextLoadRef.current = true   // ponytail: we already loaded below
      setActive(resp.conversation_id)
      setInput(''); setImage(null)
      if (imagePreview) URL.revokeObjectURL(imagePreview)  // ponytail: free the blob
      setImagePreview(null)
      await loadThreads()
      await loadConv(resp.conversation_id)
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  async function validate(decision) {
    if (!active || active === 'new') return
    try {
      await apiFetch('/chat/' + active + '/validate', { method: 'POST', body: JSON.stringify({ decision }) })
      await loadConv(active)
    } catch (e) { setErr(e.message) }
  }

  const messages = conv?.messages || []
  const needsValidation = messages.some(m => m.role === 'agent' && m.agent?.endsWith('HUMAN_VALIDATION'))

  return (
    <div className="patient">
      <aside className="threads">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Conversations</h3>
          <Button className="btn-sm" onClick={() => { setActive('new'); setConv(null) }}>New</Button>
        </div>
        {threads.length === 0 && <div className="muted">No conversations yet.</div>}
        {threads.map(t => (
          <button key={t.id} className={'thread-item ' + (active === t.id ? 'active' : '')}
                  onClick={() => setActive(t.id)}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title || '(empty)'}</div>
            <div className="muted" style={{ fontSize: 11 }}>{new Date(t.updated_at).toLocaleString()}</div>
          </button>
        ))}
      </aside>
      <main className="chat">
        <div className="messages">
          {active === 'new' && (
            <div className="empty-state">
              <div className="empty-title">Describe your symptoms</div>
              <div className="empty-body">Ask a question or upload a medical image.</div>
              <div className="empty-action col">
                {STARTERS.map(s => <Button key={s} variant="outline" onClick={() => send(s)}>{s}</Button>)}
              </div>
            </div>
          )}
          {messages.map((m, i) => <Bubble key={i} m={m} />)}
          {needsValidation && (
            <div className="row" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              <Button variant="outline" onClick={() => validate('approve')}>Approve</Button>
              <Button variant="outline" onClick={() => validate('reject')}>Reject</Button>
            </div>
          )}
          {busy && <div className="bubble bubble-agent"><Spinner /></div>}
        </div>
        {err && <div className="err" style={{ padding: '0 12px' }}>{err}</div>}
        <div className="composer">
          {imagePreview && (
            <div className="attach-preview">
              <img src={imagePreview} alt="attached" />
              <button type="button" className="attach-clear" aria-label="Remove image"
                      onClick={() => { setImage(null); setImagePreview(null) }}>×</button>
            </div>
          )}
          <label className="btn btn-outline attach">
            <input type="file" accept="image/png,image/jpeg" style={{ display: 'none' }}
                   onChange={e => {
                     // ponytail: clear value so re-selecting the SAME file
                     // still fires onChange (browsers suppress duplicate picks
                     // otherwise — common cause of "image didn't attach" UX bug).
                     const f = e.target.files?.[0] || null
                     e.target.value = ''
                     setImage(f)
                     if (imagePreview) URL.revokeObjectURL(imagePreview)
                     setImagePreview(f ? URL.createObjectURL(f) : null)
                   }} />
            {image ? '✓ image' : '📎 image'}
          </label>
          <textarea className="input" placeholder="Ask a medical question…"
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
          <Button variant="primary" onClick={() => send()} disabled={busy}>Send</Button>
        </div>
      </main>
    </div>
  )
}
