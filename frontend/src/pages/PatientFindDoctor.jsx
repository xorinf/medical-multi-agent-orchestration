import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { Button, Card, EmptyState, Input, Pill, Spinner } from '../ui'

export default function PatientFindDoctor() {
  const [tab, setTab] = useState('match')  // 'match' | 'browse'
  const [symptoms, setSymptoms] = useState('')
  const [match, setMatch] = useState(null)
  const [matchBusy, setMatchBusy] = useState(false)

  const [q, setQ] = useState('')
  const [spec, setSpec] = useState('')
  const [list, setList] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [selected, setSelected] = useState(null)
  const [bookAt, setBookAt] = useState('')
  const [notes, setNotes] = useState('')
  const [bookResult, setBookResult] = useState(null)

  useEffect(() => { if (tab === 'browse') load() }, [tab, spec])

  async function load() {
    setBusy(true); setErr('')
    try {
      const params = new URLSearchParams()
      if (spec) params.set('specialty', spec)
      if (q) params.set('q', q)
      const r = await apiFetch('/doctors?' + params.toString())
      setList(r)
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  async function runMatch() {
    if (!symptoms.trim()) return
    setMatchBusy(true); setErr(''); setMatch(null)
    try {
      const r = await apiFetch('/doctors/match', { method: 'POST', body: JSON.stringify({ symptoms_text: symptoms }) })
      setMatch(r)
    } catch (e) { setErr(e.message) }
    finally { setMatchBusy(false) }
  }

  async function book() {
    if (!selected || !bookAt) return
    setErr('')
    try {
      const r = await apiFetch('/appointments', { method: 'POST', body: JSON.stringify({
        doctor_id: selected, scheduled_at: bookAt, notes,
      }) })
      setBookResult(r)
      setSelected(null); setBookAt(''); setNotes('')
    } catch (e) { setErr(e.message) }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Find a doctor</h1>
        <div className="row">
          <Button variant={tab === 'match' ? 'primary' : 'outline'} onClick={() => setTab('match')}>Match from symptoms</Button>
          <Button variant={tab === 'browse' ? 'primary' : 'outline'} onClick={() => setTab('browse')}>Browse</Button>
        </div>
      </div>
      {err && <div className="err">{err}</div>}

      {tab === 'match' && (
        <Card>
          <div className="col">
            <Input label="Describe your symptoms" placeholder="e.g. I have chest pain for 2 days"
                   value={symptoms} onChange={e => setSymptoms(e.target.value)} />
            <Button variant="primary" onClick={runMatch} disabled={!symptoms.trim() || matchBusy}>
              {matchBusy ? 'Matching…' : 'Find a matching doctor'}
            </Button>
            {matchBusy && <div className="row"><Spinner /> <span className="muted">Analyzing symptoms…</span></div>}
          </div>
        </Card>
      )}

      {tab === 'match' && match && (
        <div style={{ marginTop: 16 }}>
          <Card>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <div><strong>{match.specialty}</strong> <span className="muted">— urgency {match.urgency}</span></div>
                {match.red_flags.length > 0 && (
                  <div className="muted" style={{ marginTop: 4 }}>Red flags: {match.red_flags.join(', ')}</div>
                )}
              </div>
            </div>
          </Card>
          <div style={{ height: 12 }} />
          {match.doctors.length === 0 && <EmptyState title="No doctors available" />}
          <div className="list">
            {match.doctors.map(d => (
              <DoctorCard key={d.id} d={d} onRequest={() => setSelected(d.id)} />
            ))}
          </div>
        </div>
      )}

      {tab === 'browse' && (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <Pill active={spec === ''} onClick={() => setSpec('')}>All</Pill>
            {['cardiology', 'dermatology', 'neurology', 'general'].map(s =>
              <Pill key={s} active={spec === s} onClick={() => setSpec(s)}>{s}</Pill>
            )}
          </div>
          <div className="row" style={{ marginBottom: 12 }}>
            <Input placeholder="Search name or bio" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
            <Button variant="outline" onClick={load}>Search</Button>
          </div>
          {bookResult && <div className="card" style={{ marginBottom: 12 }}>Appointment requested (status: {bookResult.status}).</div>}
          <Card>
            {list.length === 0 && !busy && <EmptyState title="No doctors found" body="Try a different specialty." />}
            <div className="list">
              {list.map(d => (
                <DoctorCard key={d.id} d={d} onRequest={() => setSelected(d.id)} />
              ))}
            </div>
          </Card>
        </>
      )}

      {selected && (
        <Card style={{ marginTop: 12 }}>
          <h3>Request appointment</h3>
          <div className="col">
            <Input type="datetime-local" label="Date & time" value={bookAt} onChange={e => setBookAt(e.target.value)} />
            <Input label="Notes for doctor" value={notes} onChange={e => setNotes(e.target.value)} />
            <div className="row">
              <Button variant="primary" onClick={book} disabled={!bookAt}>Confirm request</Button>
              <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function DoctorCard({ d, onRequest }) {
  return (
    <div className="list-item" key={d.id}>
      <div style={{ flex: 1 }}>
        <div><strong>{d.name}</strong> <span className="meta">— {d.specialty || 'general'}</span></div>
        <div className="meta">{d.city} · {d.cases_count || 0} cases · ★ {(d.rating || 0).toFixed(1)}</div>
        <div style={{ fontSize: 13 }}>{d.bio}</div>
        {d.score !== undefined && <div className="meta">match score {d.score}</div>}
        {!d.verified && <div className="meta">⚠ pending verification</div>}
      </div>
      <Button variant="outline" onClick={onRequest} disabled={!d.verified}>Request</Button>
    </div>
  )
}
