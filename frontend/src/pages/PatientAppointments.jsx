import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'
import { Button, Card, EmptyState } from '../ui'

export default function PatientAppointments() {
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState('')  // ponytail: per-row busy guard

  useEffect(() => { load() }, [])

  async function load() {
    try { setList(await apiFetch('/appointments?role=patient')) }
    catch (e) { setErr(e.message) }
  }

  async function cancel(id) {
    if (!confirm('Cancel this appointment?')) return
    setBusyId(id); setErr('')
    try {
      await apiFetch('/appointments/' + id + '/cancel', { method: 'POST' })
      await load()
    } catch (e) { setErr(e.message) }
    finally { setBusyId('') }
  }

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">My appointments</h1></div>
      {err && <div className="err">{err}</div>}
      <Card>
        {list.length === 0 && <EmptyState title="No appointments yet" body="Find a doctor to request a visit." />}
        <div className="list">
          {list.map(a => (
            <div className="list-item" key={a.id}>
              <div style={{ flex: 1 }}>
                <div><strong>{new Date(a.scheduled_at).toLocaleString()}</strong></div>
                <div className="meta">
                  with <strong>{a.other_name || 'doctor'}</strong>
                  {a.other_specialty && ` · ${a.other_specialty}`}
                </div>
                <div className="meta">status: {a.status} · {a.duration_min} min</div>
                {a.notes_from_doctor && <div style={{ fontSize: 13, marginTop: 4 }}>Doctor: {a.notes_from_doctor}</div>}
                {a.notes_from_patient && <div className="meta" style={{ marginTop: 4 }}>You: {a.notes_from_patient}</div>}
              </div>
              {/* ponytail: actions sit on the right; only future+active appointments
                  are cancellable (the backend's past-date guard rejects everything else). */}
              <div className="row" style={{ gap: 8 }}>
                <Button variant="outline" className="btn-sm"
                        onClick={() => cancel(a.id)}
                        disabled={busyId === a.id || a.status === 'cancelled'}>
                  {busyId === a.id ? '…' : 'Cancel'}
                </Button>
                {/* ponytail: "Message doctor" routes into the existing chat
                    thread. Reusing /chat means we don't build a separate
                    messaging surface — chat already handles text + images +
                    thinking blocks. */}
                <Link to={`/chat?to=${a.doctor_id}`} className="btn btn-outline btn-sm">
                  Message
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
