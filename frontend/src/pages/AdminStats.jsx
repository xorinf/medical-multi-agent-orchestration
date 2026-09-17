import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'
import { Card, Button, Spinner, EmptyState } from '../ui'

const Stat = ({ label, value, sub }) => (
  <div className="stat-card">
    <div className="stat-num">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>}
  </div>
)

const Action = ({ title, body, to, cta, urgent }) => (
  <Card style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ flex: 1 }}>
      <div className="row" style={{ gap: 8 }}>
        <h3 style={{ fontSize: 15 }}>{title}</h3>
        {urgent && <span className="pill pill-on" style={{ padding: '2px 8px', fontSize: 11 }}>Action needed</span>}
      </div>
      <div className="muted" style={{ marginTop: 4 }}>{body}</div>
    </div>
    <Link to={to}><Button variant={urgent ? 'primary' : 'outline'}>{cta}</Button></Link>
  </Card>
)

export default function AdminStats() {
  const [stats, setStats] = useState(null)
  const [pending, setPending] = useState([])
  const [audit, setAudit] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    Promise.all([
      apiFetch('/admin/stats'),
      apiFetch('/admin/doctors/pending'),
      apiFetch('/admin/audit?limit=10'),
    ]).then(([s, p, a]) => {
      setStats(s); setPending(p); setAudit(a)
    }).catch(e => setErr(e.message))
  }, [])

  if (err) return <div className="page"><div className="err">{err}</div></div>
  if (!stats) return <div className="page"><Spinner /></div>

  const today = new Date().toISOString().slice(0, 10)
  const actionItems = []
  if (stats.doctors_pending > 0) actionItems.push({
    title: `${stats.doctors_pending} doctor${stats.doctors_pending === 1 ? '' : 's'} waiting for verification`,
    body: 'Their profiles are invisible to patients until you approve their medical license.',
    to: '/admin/pending', cta: 'Review', urgent: true,
  })
  if (stats.chats_today === 0) actionItems.push({
    title: 'No patient chats today',
    body: 'Either it is early in the day or no patients have signed in. Check the audit feed for context.',
    to: '/admin/audit', cta: 'Open audit', urgent: false,
  })
  if (actionItems.length === 0) actionItems.push({
    title: 'Inbox zero',
    body: 'No pending actions. Browse the audit feed for context or wait for new activity.',
    to: '/admin/audit', cta: 'Open audit', urgent: false,
  })

  return (
    <div className="admin">
      <div className="page-header">
        <div>
          <h1 className="page-title">System overview</h1>
          <div className="muted">{today}</div>
        </div>
        <div className="row">
          <Link to="/admin/pending"><Button variant="outline">Pending verifications</Button></Link>
          <Link to="/admin/users"><Button variant="outline">All users</Button></Link>
        </div>
      </div>

      <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 12 }}>Today</h2>
      <div className="admin-grid">
        <Stat label="Users total" value={stats.users} sub={`${stats.patients} patients · ${stats.doctors} doctors`} />
        <Stat label="Chats today" value={stats.chats_today} sub="across all patients" />
        <Stat label="Pending doctors" value={stats.doctors_pending} sub={stats.doctors_pending > 0 ? 'awaiting review' : 'all clear'} />
      </div>

      <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginTop: 32, marginBottom: 12 }}>Action queue</h2>
      <div className="col">
        {actionItems.map((a, i) => <Action key={i} {...a} />)}
      </div>

      {pending.length > 0 && (
        <>
          <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginTop: 32, marginBottom: 12 }}>Pending verifications</h2>
          <Card>
            <div className="list">
              {pending.slice(0, 5).map(p => (
                <div key={p.id} className="list-item">
                  <div style={{ flex: 1 }}>
                    <strong>{p.name}</strong> <span className="muted">— {p.specialty || 'general'}</span>
                    <div className="muted">{p.email} · license {p.license_no}</div>
                  </div>
                  <Link to="/admin/pending"><Button variant="outline">Review</Button></Link>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginTop: 32, marginBottom: 12 }}>Recent activity</h2>
      <Card>
        {audit.length === 0
          ? <EmptyState title="No activity yet" body="Events appear here as users log in and act." />
          : <div className="list">
              {audit.slice(0, 10).map(e => (
                <div key={e.id} className="list-item">
                  <div style={{ flex: 1 }}>
                    <div><strong>{e.action}</strong>
                      {e.target?.type && <span className="muted"> — {e.target.type}/{e.target.id?.slice(0,8) || '—'}</span>}
                    </div>
                    <div className="muted">{new Date(e.ts).toLocaleString()} · actor {e.actor_id?.slice(0,8) || 'anon'}</div>
                  </div>
                </div>
              ))}
            </div>}
      </Card>
    </div>
  )
}
