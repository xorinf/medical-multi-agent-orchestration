import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../api'
import { Button, Card } from '../ui'

const STEPS = {
  patient: [
    { title: 'Tell us what brings you here',
      body: 'Open your first chat and describe your symptoms in your own words. The assistant will guide you from there.' },
    { title: 'Add an image if you have one',
      body: 'Photos of skin lesions, chest X-rays, or any medical image you can share can speed up the triage.' },
    { title: 'See a verified doctor when you need one',
      body: 'After your first chat, we will suggest the right specialty and a ranked list of verified doctors you can book.' },
  ],
  doctor: [
    { title: 'Welcome to your doctor dashboard',
      body: 'Your account is in verification. An admin will review your license and approve you within one business day.' },
    { title: 'When approved, claim your cases',
      body: 'Patients who use the chat will land in the Unassigned queue. Claim one to start a consultation, add notes, and close when done.' },
    { title: 'Set up your daily curator',
      body: 'Each morning, MedAssist builds a 3-topic digest in your specialty — clinical guidelines, case reports, and recent innovations.' },
  ],
}

STEPS.admin = [
  { title: 'Keep the network healthy',
    body: 'Approve doctor credentials, review audit logs, and watch system stats. Every action you take here is logged.' },
  { title: 'Start with pending verifications',
    body: 'New doctors cannot appear in patient search until you verify their medical license. Open Pending to begin.' },
  { title: 'Watch the audit feed',
    body: 'Every login, claim, and note across the platform appears in your audit log. Use System to see it.' },
]


export default function Onboarding() {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const nav = useNavigate()
  const steps = STEPS[user?.role] || STEPS.patient
  const last = step === steps.length - 1

  useEffect(() => { if (!user) nav('/login') }, [user, nav])
  if (!user) return null

  function next() {
    if (last) {
      const uid = user.id || user._id  // ponytail: api.jsx returns {id}; older rows had _id
      localStorage.setItem('onboarded_' + uid, '1')
      if (user.role === 'doctor') nav('/queue')
      else if (user.role === 'admin') nav('/admin/pending')
      else nav('/chat')
    }
    else setStep(s => s + 1)
  }

  return (
    <div className="onboarding">
      <div className="onboarding-progress">
        {steps.map((_, i) => <span key={i} className={i <= step ? 'done' : ''} />)}
      </div>
      <Card className="onboarding-step anim-fade-up" key={step}>
        <span className="eyebrow">Welcome{user.name ? `, ${user.name.split(' ')[0]}` : ''}</span>
        <h2>{steps[step].title}</h2>
        <p className="lead">{steps[step].body}</p>
        <div className="checklist">
          {steps.map((s, i) => (
            <div key={i} className={'check-item ' + (i <= step ? 'done' : '')}>
              <span className="num">{i + 1}</span>
              <div className="body">
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 28, justifyContent: 'space-between' }}>
          <Button variant="ghost" onClick={() => nav(user.role === 'doctor' ? '/queue' : '/chat')}>Skip</Button>
          <Button variant="primary" onClick={next}>{last ? 'Enter dashboard' : 'Next'}</Button>
        </div>
      </Card>
    </div>
  )
}
