import { useEffect, useState } from 'react'
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
  if (m.role === 'patient') {
    return (
      <div className="bubble bubble-you">
        {m.image_url && <img src={m.image_url} alt="" />}
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
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { loadThreads() }, [])
  useEffect(() => {
    if (active && active !== 'new') loadConv(active)
    else setConv(null)
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

    let uploaded = null
    if (image) {
      // ponytail: upload FIRST so the optimistic bubble can show a real
      // /uploads/<file_id> URL that survives reloads (blob: URLs don't).
      try {
        const fd = new FormData()
        fd.append('file', image)
        uploaded = await apiFetch('/chat/upload', { method: 'POST', body: fd })
      } catch (e) {
        setErr('upload failed: ' + e.message)
        setBusy(false)
        return
      }
    }

    const useExisting = active !== 'new'
    // ponytail: optimistically append the patient bubble so the user sees their
    // own message immediately, before the agent finishes.
    setConv(prev => {
      const base = prev || { _id: null, messages: [] }
      return {
        ...base,
        messages: [
          ...(base.messages || []),
          { role: 'patient', content: txt, image_url: uploaded?.url || null,
            ts: new Date().toISOString() },
        ],
      }
    })

    try {
      const body = uploaded
        ? { text: txt, image_file_id: uploaded.file_id, conversation_id: useExisting ? active : undefined }
        : { text: txt, conversation_id: useExisting ? active : undefined }
      const resp = await apiFetch('/chat', { method: 'POST', body: JSON.stringify(body) })
      setActive(resp.conversation_id)
      setInput(''); setImage(null)
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
          <label className="btn btn-outline attach">
            <input type="file" accept="image/png,image/jpeg" style={{ display: 'none' }}
                   onChange={e => setImage(e.target.files?.[0] || null)} />
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
