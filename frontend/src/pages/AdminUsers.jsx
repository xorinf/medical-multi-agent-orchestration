import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { Card, EmptyState, Button, Spinner } from '../ui'

export default function AdminUsers() {
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(true)
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => { load() }, [role, status])
  // q triggers reload on Enter
  async function load() {
    setBusy(true); setErr('')
    try {
      const params = new URLSearchParams()
      if (role) params.set('role', role)
      if (status) params.set('status', status)
      if (q) params.set('q', q)
      const r = await apiFetch('/admin/users?' + params.toString())
      setList(r)
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  async function suspend(id) {
    const reason = prompt('Reason for suspension?')
    if (!reason) return
    try {
      await apiFetch('/admin/users/' + id + '/suspend', { method: 'POST', body: JSON.stringify({ reason }) })
      await load()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div className="admin">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <div className="muted">{list.length} shown</div>
        </div>
      </div>
      <Card style={{ marginBottom: 16 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <input className="input" placeholder="Search email or name" value={q}
                 onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
                 style={{ flex: 1, minWidth: 220 }} />
          <select className="input" value={role} onChange={e => setRole(e.target.value)} style={{ width: 160 }}>
            <option value="">All roles</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Admins</option>
          </select>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 200 }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending_verification">Pending verification</option>
            <option value="suspended">Suspended</option>
          </select>
          <Button variant="outline" onClick={load}>Apply</Button>
        </div>
      </Card>

      {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}
      {busy && <div style={{ padding: 24, textAlign: 'center' }}><Spinner /></div>}

      {!busy && list.length === 0 && (
        <Card><EmptyState title="No users match" body="Try clearing the filters." /></Card>
      )}

      {!busy && list.length > 0 && (
        <Card>
          <div className="list">
            {list.map(u => (
              <div key={u.id} className="list-item">
                <div style={{ flex: 1 }}>
                  <div><strong>{u.name}</strong> <span className="muted">— {u.role}</span></div>
                  <div className="meta">{u.email} · {u.status || 'active'} · joined {new Date(u.created_at).toLocaleDateString()}</div>
                </div>
                {u.status !== 'suspended' && u.role !== 'admin' && (
                  <Button variant="outline" onClick={() => suspend(u.id)}>Suspend</Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
