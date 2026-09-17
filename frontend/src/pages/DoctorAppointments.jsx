import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { Button, Card, EmptyState, Spinner, Textarea } from '../ui'

export default function DoctorAppointments() {
  const [list, setList] = useState([])
  const [editing, setEditing] = useState(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    setBusy(true)
    try { setList(await apiFetch('/appointments?role=doctor')) }
    catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  async function patch(id, body) {
    try {
      await apiFetch('/appointments/' + id, { method: 'PATCH', body: JSON.stringify(body) })
      setEditing(null); setNotes(''); await load()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Appointments</h1></div>
      {err && <div className="err">{err}</div>}
      {busy && <Spinner />}
      <Card>
        {list.length === 0 && !busy && <EmptyState title="No appointments" />}
        <div className="list">
          {list.map(a => (
            <div className="list-item" key={a.id}>
              <div style={{ flex: 1 }}>
                <div><strong>{new Date(a.scheduled_at).toLocaleString()}</strong> <span className="meta">· {a.status}</span></div>
                {a.notes_from_patient && <div className="meta">Patient: {a.notes_from_patient}</div>}
                {a.notes_from_doctor && <div style={{ fontSize: 13, marginTop: 4 }}>You: {a.notes_from_doctor}</div>}
                {editing === a.id && (
                  <div className="col" style={{ marginTop: 8 }}>
                    <Textarea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
                    <div className="row">
                      <Button variant="primary" onClick={() => patch(a.id, { status: 'confirmed', notes_from_doctor: notes })}>Confirm + save</Button>
                      <Button variant="outline" onClick={() => patch(a.id, { status: 'cancelled' })}>Cancel</Button>
                      <Button variant="ghost" onClick={() => setEditing(null)}>Close</Button>
                    </div>
                  </div>
                )}
              </div>
              {editing !== a.id && (
                <Button variant="outline" onClick={() => { setEditing(a.id); setNotes(a.notes_from_doctor || '') }}>Manage</Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
