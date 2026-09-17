import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { Button, Card, EmptyState, Pill } from '../ui'

export default function AdminPending() {
  const [list, setList] = useState([])
  const [err, setErr] = useState('')

  async function load() {
    try { setList(await apiFetch('/admin/doctors/pending')) }
    catch (e) { setErr(e.message) }
  }
  useEffect(() => { load() }, [])

  async function decide(id, decision) {
    try {
      await apiFetch(`/admin/doctors/${id}/verify`, { method: 'POST', body: JSON.stringify({ decision }) })
      await load()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Doctors pending verification</h1></div>
      {err && <div className="err">{err}</div>}
      <Card>
        {list.length === 0 && <EmptyState title="No pending doctors" />}
        <div className="list">
          {list.map(d => (
            <div className="list-item" key={d.id}>
              <div style={{ flex: 1 }}>
                <div><strong>{d.name}</strong> — {d.specialty || 'general'}</div>
                <div className="meta">{d.email} · license {d.license_no}</div>
              </div>
              <div className="row">
                <Button variant="primary" onClick={() => decide(d.id, 'approve')}>Approve</Button>
                <Button variant="danger" onClick={() => decide(d.id, 'reject')}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
