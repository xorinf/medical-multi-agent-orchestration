import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { Button, Card, EmptyState, Spinner, Textarea } from '../ui'

export default function DoctorQueue() {
  const [tab, setTab] = useState('mine')  // 'mine' | 'unassigned'
  const [list, setList] = useState([])
  const [active, setActive] = useState(null)
  const [case_, setCase] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { load() }, [tab])
  useEffect(() => { if (active) loadCase(active) }, [active])

  async function load() {
    setBusy(true); setErr('')
    try {
      const r = await apiFetch(tab === 'mine' ? '/cases' : '/cases/unassigned')
      setList(r)
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  async function loadCase(id) {
    try {
      if (tab === 'unassigned') return  // can't fetch detail until claimed
      setCase(await apiFetch('/cases/' + id))
    } catch (e) { setErr(e.message) }
  }

  async function claim(id) {
    try {
      await apiFetch('/cases/' + id + '/claim', { method: 'POST' })
      setTab('mine'); setActive(id)
      await load()
    } catch (e) { setErr(e.message) }
  }

  async function addNote() {
    if (!active || !note.trim()) return
    try {
      await apiFetch('/cases/' + active + '/note', { method: 'POST', body: JSON.stringify({ note }) })
      setNote(''); await loadCase(active)
    } catch (e) { setErr(e.message) }
  }

  async function closeCase() {
    if (!active) return
    try {
      await apiFetch('/cases/' + active + '/close', { method: 'POST' })
      setActive(null); setCase(null); await load()
    } catch (e) { setErr(e.message) }
  }

  async function validate(decision) {
    if (!active) return
    try {
      await apiFetch('/cases/' + active + '/validate', { method: 'POST', body: JSON.stringify({ decision }) })
      await loadCase(active)
    } catch (e) { setErr(e.message) }
  }

  return (
    <div className="doctor">
      <aside className="doctor-side">
        <div className="row" style={{ gap: 4 }}>
          <Button variant={tab === 'mine' ? 'primary' : 'outline'} onClick={() => { setTab('mine'); setActive(null); setCase(null) }}>My queue</Button>
          <Button variant={tab === 'unassigned' ? 'primary' : 'outline'} onClick={() => { setTab('unassigned'); setActive(null); setCase(null) }}>Unassigned</Button>
        </div>
        <Card>
          {busy && <Spinner />}
          {!busy && list.length === 0 && <EmptyState title={tab === 'mine' ? 'No assigned cases' : 'Inbox zero'} />}
          <div className="list">
            {list.map(c => (
              <div key={c.id} className={'list-item ' + (active === c.id ? 'active' : '')}
                   style={{ cursor: 'pointer', background: active === c.id ? 'var(--bg-2)' : 'transparent' }}
                   onClick={() => setActive(c.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || '(empty)'}</div>
                  <div className="meta">{c.status} · {new Date(c.updated_at).toLocaleString()}</div>
                </div>
                {tab === 'unassigned' && (
                  <Button variant="outline" className="btn-sm" onClick={(e) => { e.stopPropagation(); claim(c.id) }}>Claim</Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </aside>
      <main>
        {!active && <EmptyState title="Select a case" body="Pick one from the queue." />}
        {active && tab === 'unassigned' && <EmptyState title="Claim this case to view details" body="Click Claim in the queue." />}
        {case_ && (
          <div className="col" style={{ height: '100%' }}>
            <Card>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>{case_.patient?.name || 'Patient'}</strong>
                  <div className="meta">{case_.patient?.email}</div>
                </div>
                <div className="row">
                  <Button variant="outline" onClick={closeCase}>Close case</Button>
                </div>
              </div>
            </Card>
            <Card style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              {case_.messages.map((m, i) => (
                <div key={i} className={'bubble ' + (m.role === 'doctor' ? 'bubble-you' : 'bubble-agent')}
                     style={{ marginBottom: 8 }}>
                  {m.role !== 'doctor' && m.image_url && (
                    <a href={`${m.image_url}${m.image_url.includes('?') ? '&' : '?'}token=${localStorage.getItem('access_token') || ''}`} target="_blank" rel="noopener noreferrer">
                      <img src={`${m.image_url}${m.image_url.includes('?') ? '&' : '?'}token=${localStorage.getItem('access_token') || ''}`} alt="" />
                    </a>
                  )}
                  {m.content}
                  <div className="bubble-meta">{m.role}{m.agent ? ` · ${m.agent}` : ''} · {new Date(m.ts).toLocaleString()}</div>
                </div>
              ))}
            </Card>
            <Card>
              {/* ponytail: clinical validation buttons live HERE — the
                  assigned doctor makes the yes/no call on the AI's
                  medical output. Patient only sees a notice in their chat. */}
              {case_.messages?.some(m => m.role === 'agent' && (m.agent || '').endsWith('HUMAN_VALIDATION')) &&
               !case_.human_validations?.some(v => v.decision) && (
                <div className="col" style={{ marginBottom: 12 }}>
                  <div className="meta">Clinical validation required.</div>
                  <div className="row">
                    <Button variant="primary" onClick={() => validate('approve')}>Approve AI analysis</Button>
                    <Button variant="danger" onClick={() => validate('reject')}>Reject</Button>
                  </div>
                </div>
              )}
              <div className="col">
                <Textarea label="Add a note (visible to you; not auto-shared)" value={note} onChange={e => setNote(e.target.value)} />
                <Button variant="primary" onClick={addNote} disabled={!note.trim()}>Add note</Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
