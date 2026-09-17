import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { Button, Card, EmptyState, Spinner } from '../ui'

export default function DoctorCurator() {
  const [digest, setDigest] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function load(force = false) {
    setBusy(true); setErr('')
    try {
      const r = await apiFetch(force ? '/curator/refresh' : '/curator/today', { method: force ? 'POST' : 'GET' })
      setDigest(r)
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }
  useEffect(() => { load() }, [])

  async function save(idx, digestId) {
    try {
      await apiFetch('/curator/save', { method: 'POST', body: JSON.stringify({ digest_id: digestId, topic_idx: idx }) })
    } catch (e) { setErr(e.message) }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Daily curator</h1>
        <Button variant="outline" onClick={() => load(true)} disabled={busy}>{busy ? <Spinner /> : 'Refresh'}</Button>
      </div>
      {err && <div className="err">{err}</div>}
      {!digest && busy && <Card><Spinner /></Card>}
      {digest && (
        <>
          <div className="muted" style={{ marginBottom: 8 }}>{digest.date} {digest.cached ? '(cached)' : '(fresh)'}</div>
          {digest.topics.length === 0 && <EmptyState title="Nothing today" body="Click refresh to generate." />}
          {digest.topics.map((t, i) => (
            <div className="topic" key={i}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="topic-title">{t.topic}</div>
                <Button className="btn-sm" variant="ghost" onClick={() => save(i, digest._id || '')}>Save</Button>
              </div>
              {t.sources.map((s, j) => <div key={j} className="topic-snippet">{s.snippet}</div>)}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
