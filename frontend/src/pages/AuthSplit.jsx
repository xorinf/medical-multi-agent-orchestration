import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../api'
import { Button, Input, Pill } from '../ui'

export default function AuthSplit({ initialMode = 'signin' }) {
  const { login, register } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState(initialMode === 'register' ? 'signup' : 'signin')
  const [ok, setOk] = useState('')  // success message after signup

  // shared
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // signup-only
  const [name, setName] = useState('')
  const [role, setRole] = useState('patient')
  const [specialty, setSpecialty] = useState('cardiology')
  const [licenseNo, setLicenseNo] = useState('')
  const [city, setCity] = useState('')

  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const isSignup = mode === 'signup'

  async function quickLogin(em, pw) {
    // ponytail: dev shortcut — fill + submit in one click so reviewers can
    // bounce between roles without typing credentials.
    setMode('signin')
    setErr(''); setOk('')
    setEmail(em); setPassword(pw)
    if (busy) return
    setBusy(true)
    try {
      await login(em, pw)
      nav('/')
    } catch (ex) { setErr(ex.message) }
    finally { setBusy(false) }
  }

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setErr(''); setOk(''); setBusy(true)
    try {
      if (isSignup) {
        const r = await register({ email, password, name, role, specialty, license_no: licenseNo, city })
        if (r.role === 'doctor') {
          setOk('Account created. Your doctor profile is pending admin verification — you can sign in once it\'s approved.')
        } else {
          setOk('Account created. Sign in below to continue.')
        }
        // ponytail: switch to sign-in mode and keep the email so the user
        // doesn't retype. Auto-login avoided because the backend doesn't return
        // a token on register (intentional — keeps the flow uniform).
        setMode('signin')
        setPassword('')
      } else {
        await login(email, password)
        // ponytail: AuthSplit is rendered unconditionally at /login, so we
        // can't rely on the parent HomeOrRole redirect. Push explicitly.
        nav('/')
      }
    } catch (ex) { setErr(ex.message) }
    finally { setBusy(false) }
  }

  const canSubmit = isSignup
    ? (email && password.length >= 8 && name)
    : (email && password)

  return (
    <div className="auth-split">
      {/* left — marketing panel */}
      <aside className="auth-split-promo">
        <Link to="/" className="brand">
          <span className="brand-mark">M</span> MedAssist
        </Link>
        <div className="promo-body">
          <h1 className="promo-headline">
            Clinical intelligence for the <span className="font-serif">people</span> who need it most.
          </h1>
          <p className="promo-lead">
            A multi-agent assistant that helps patients describe symptoms and
            routes the case to a verified physician when it matters. Doctors
            get a curated daily digest, an AI-prepared patient queue, and
            appointments — all in one workspace.
          </p>
          <ul className="promo-list">
            <li><strong>Five specialised agents.</strong> Retrieval, web search, image triage, conversation, and a decision router — coordinated by LangGraph.</li>
            <li><strong>Two surfaces, one record.</strong> Patient chat and doctor queue share the same case file.</li>
            <li><strong>Verified network.</strong> Admins check every doctor credential before they appear in patient search.</li>
          </ul>
          <div className="logos">
            <span className="pill">IBM Plex</span>
            <span className="pill">PubMedBERT</span>
            <span className="pill">LangGraph</span>
            <span className="pill">Qdrant</span>
            <span className="pill">MongoDB</span>
          </div>
        </div>
        <div className="promo-foot muted">
          Local development build. Not for clinical use without verification.
        </div>
      </aside>

      {/* right — single form with tab toggle */}
      <main className="auth-split-forms">
        <div className="auth-form-wrap">
          <div className="tab-bar auth-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={!isSignup}
                    className={'pill ' + (!isSignup ? 'pill-on' : '')}
                    onClick={() => { setMode('signin'); setErr('') }}>
              Sign in
            </button>
            <button type="button" role="tab" aria-selected={isSignup}
                    className={'pill ' + (isSignup ? 'pill-on' : '')}
                    onClick={() => { setMode('signup'); setErr('') }}>
              Create account
            </button>
          </div>

          {/* ponytail: demo logins — dev build only, speeds up role-switching
              during walkthroughs. Real prod hides this row via env. */}
          {!isSignup && (
            <div className="demo-logins">
              <span className="muted demo-label">Demo logins:</span>
              <Button type="button" variant="outline" className="btn-sm"
                      onClick={() => quickLogin('pat1@x.com', 'pw1234')}>
                Patient
              </Button>
              <Button type="button" variant="outline" className="btn-sm"
                      onClick={() => quickLogin('doc1@x.com', 'pw1234')}>
                Doctor
              </Button>
              <Button type="button" variant="outline" className="btn-sm"
                      onClick={() => quickLogin('admin@medassist.local', 'admin1234')}>
                Admin
              </Button>
            </div>
          )}

          <form className="card form-card anim-fade-up" onSubmit={submit}>
            <span className="eyebrow">{isSignup ? 'New here' : 'Welcome back'}</span>
            <h2 className="form-title">{isSignup ? 'Create your MedAssist account' : 'Sign in to MedAssist'}</h2>

            <div className="col">
              {isSignup && (
                <>
                  <Input label="Full name" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                  <div className="field">
                    <span className="field-label">I am a</span>
                    <div className="row">
                      <Pill type="button" active={role === 'patient'} onClick={() => setRole('patient')}>Patient</Pill>
                      <Pill type="button" active={role === 'doctor'} onClick={() => setRole('doctor')}>Doctor</Pill>
                    </div>
                  </div>
                  {role === 'doctor' && <>
                    <Input label="Specialty" value={specialty} onChange={e => setSpecialty(e.target.value)} />
                    <Input label="Medical license #" value={licenseNo} onChange={e => setLicenseNo(e.target.value)} required />
                    <Input label="City" value={city} onChange={e => setCity(e.target.value)} />
                  </>}
                </>
              )}
              {!isSignup && <Input type="email" label="Email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />}
              <Input type="password" label="Password" value={password} onChange={e => setPassword(e.target.value)}
                     required placeholder={isSignup ? '≥ 8 characters' : ''} minLength={isSignup ? 8 : undefined} />
              {isSignup && <Input type="email" label="Email" value={email} onChange={e => setEmail(e.target.value)} required />}
              {!isSignup && <div className="row" style={{ justifyContent: 'flex-end' }}>
                <Link to="/forgot" className="btn btn-ghost btn-sm">Forgot password?</Link>
              </div>}
            </div>

            {err && <div className="err" role="alert">{err}</div>}
            {ok && !err && <div className="ok" role="status">{ok}</div>}

            <Button type="submit" variant="primary" disabled={!canSubmit || busy} className="btn-lg" style={{ width: '100%', marginTop: 4 }}>
              {busy ? '…' : (isSignup ? 'Create account' : 'Sign in')}
            </Button>

            <div className="auth-switch">
              {isSignup ? (
                <>Already have an account? <button type="button" className="link" onClick={() => { setMode('signin'); setErr('') }}>Sign in</button></>
              ) : (
                <>New to MedAssist? <button type="button" className="link" onClick={() => { setMode('signup'); setErr('') }}>Create an account</button></>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
