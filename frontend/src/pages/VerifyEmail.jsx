import { useState } from 'react'
import { Card } from '../ui'

// ponytail: VerifyEmail is the page shown when a user clicks the link from
// their email. It pulls the token out of the URL, calls the backend to mark
// the email verified, then shows success.
export function VerifyEmail() {
  const [status, setStatus] = useState('pending')
  const [err, setErr] = useState('')
  if (status === 'pending') {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setStatus('verifying')
      import('../api').then(({ apiFetch }) =>
        apiFetch('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
          .then(() => setStatus('done'))
          .catch(e => { setErr(e.message); setStatus('error') })
      )
    }
  }
  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1 className="auth-title">Email verification</h1>
        {status === 'pending' && <p className="muted">Open the link from your email.</p>}
        {status === 'verifying' && <p className="muted">Verifying…</p>}
        {status === 'done' && <p>Email verified. You can close this window and sign in.</p>}
        {status === 'error' && <div className="err">{err}</div>}
      </Card>
    </div>
  )
}
