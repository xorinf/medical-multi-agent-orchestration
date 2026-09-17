import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { Card, EmptyState, Spinner, Button } from '../ui'

export default function AdminAudit() {
  const [events, setEvents] = useState([])
  const [busy, setBusy] = useState(true)
  const [err, setErr] = useState('')
  const [action, setAction] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    setBusy(true); setErr('')
    try {
      const r = await apiFetch('/admin/audit?limit=200')
      setEvents(r)
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  const filtered = action
    ? events.filter(e => e.action?.includes(action))
    : events

  return (
    <div className="admin">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit log</h1>
          <div className="muted">{events.length} events</div>
        </div>
        <div className="row">
          <input className="input" placeholder="Filter by action (e.g. login, chat)" value={action}
                 onChange={e => setAction(e.target.value)} style={{ width: 240 }} />
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>
      </div>
      {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}
      {busy && <div style={{ padding: 24, textAlign: 'center' }}><Spinner /></div>}
      {!busy && filtered.length === 0 && <Card><EmptyState title="No events" body="Nothing has been logged yet." /></Card>}
      {!busy && filtered.length > 0 && (
        <Card>
          <div className="list">
            {filtered.map(e => (
              <div key={e.id} className="list-item">
                <div style={{ flex: 1 }}>
                  <div><strong>{e.action}</strong></div>
                  <div className="meta">
                    {new Date(e.ts).toLocaleString()} ·
                    actor <span className="mono">{e.actor_id ? e.actor_id.slice(0, 8) + '…' : 'anon'}</span> ·
                    target {e.target?.type || '—'}{e.target?.id ? '/' + e.target.id.slice(0, 8) + '…' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
