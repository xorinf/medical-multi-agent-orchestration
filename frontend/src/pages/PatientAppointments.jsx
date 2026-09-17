import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { Button, Card, EmptyState } from '../ui'

export default function PatientAppointments() {
  const [list, setList] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    try { setList(await apiFetch('/appointments?role=patient')) }
    catch (e) { setErr(e.message) }
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
                <div className="meta">status: {a.status} · {a.duration_min} min</div>
                {a.notes_from_doctor && <div style={{ fontSize: 13, marginTop: 4 }}>Doctor: {a.notes_from_doctor}</div>}
                {a.notes_from_patient && <div className="meta" style={{ marginTop: 4 }}>You: {a.notes_from_patient}</div>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
