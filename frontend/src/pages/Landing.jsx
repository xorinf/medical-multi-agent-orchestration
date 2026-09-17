import { Link } from 'react-router-dom'
import { Button } from '../ui'

export default function Landing() {
  return (
    <div>
      {/* top nav */}
      <nav className="landing-nav anim-fade-in">
        <Link to="/" className="brand">
          <span className="brand-mark">M</span> MedAssist
        </Link>
        <div className="spacer" />
        <Link to="/login" className="btn btn-ghost">Sign in</Link>
        <Link to="/register" className="btn btn-primary">Get started</Link>
      </nav>

      {/* hero */}
      <section className="landing-hero">
        <span className="eyebrow anim-fade-up">AI clinical copilot · v1</span>
        <h1 className="anim-fade-up">
          One assistant for <span className="accent font-serif">patients</span>,
          {' '}<span className="font-serif">doctors</span>, and clinical decisions.
        </h1>
        <p className="lead anim-fade-up">
          Describe your symptoms. Upload a medical image. MedAssist routes through
          a multi-agent pipeline — retrieval-augmented medical knowledge, web
          search, image triage — then hands the case to a verified physician when
          it matters.
        </p>
        <div className="cta-row anim-fade-up">
          <Link to="/register" className="btn btn-primary btn-lg">Create your account</Link>
          <Link to="/login" className="btn btn-outline btn-lg">Sign in</Link>
        </div>
      </section>

      {/* features */}
      <section className="landing-section">
        <span className="eyebrow anim-fade-up" style={{ display: 'block', textAlign: 'center' }}>What it does</span>
        <h2 className="anim-fade-up">Built around the consultation, not around the model</h2>
        <p className="lead anim-fade-up">
          Five specialised agents collaborate behind the scenes. The patient sees a
          single chat. The doctor sees a clean queue.
        </p>
        <div className="feature-grid anim-stagger">
          {FEATURES.map(f => (
            <div className="feature" key={f.title}>
              <div className="feature-icon">{f.glyph}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* role split */}
      <section className="landing-section">
        <span className="eyebrow" style={{ display: 'block', textAlign: 'center' }}>Two sides, one workflow</span>
        <h2 className="anim-fade-up">Built for patients <span className="font-serif">and</span> physicians</h2>
        <p className="lead anim-fade-up">Different screens. Same conversation history.</p>
        <div className="role-cards anim-stagger">
          <div className="role-card">
            <span className="eyebrow">For patients</span>
            <h3>Talk first, see a doctor when you need one</h3>
            <p>Plain-language symptom chat, image upload for skin and chest X-ray, automatic specialty matching when the AI flags your case as urgent.</p>
            <ul>
              <li>Multimodal chat (text + image)</li>
              <li>Find a verified doctor in your specialty</li>
              <li>Book appointments and view records</li>
            </ul>
            <div className="row">
              <Link to="/register" className="btn btn-primary">Start as patient</Link>
            </div>
          </div>
          <div className="role-card">
            <span className="eyebrow">For doctors</span>
            <h3>Less triage paperwork, more medicine</h3>
            <p>Patient queue with full AI-generated context, daily curated reading in your specialty, and a notes panel that syncs to the patient's record.</p>
            <ul>
              <li>Patient queue + case notes</li>
              <li>Daily curator (guidelines, cases, drugs)</li>
              <li>Appointments and schedule</li>
            </ul>
            <div className="row">
              <Link to="/register" className="btn btn-outline">Apply as doctor</Link>
            </div>
          </div>
        </div>
      </section>

      {/* tech strip */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <span className="eyebrow" style={{ display: 'block', textAlign: 'center' }}>Under the hood</span>
        <h2 className="anim-fade-up">Production-grade components</h2>
        <p className="lead anim-fade-up">Built on top of existing medical-assistant infrastructure. Local models, real vector search, human-in-the-loop validation.</p>
        <div className="logos">
          {TECH.map(t => <span key={t} className="pill">{t}</span>)}
        </div>
      </section>

      <footer className="landing-foot">
        <div>MedAssist · Local development build · Not for clinical use without verification.</div>
        <div style={{ marginTop: 6 }}>
          Designed with <span className="font-serif">care</span> · Built on the open-source medical-assistant platform.
        </div>
      </footer>
    </div>
  )
}

const FEATURES = [
  { glyph: 'M', title: 'Multimodal intake', body: 'Text or image. The pipeline picks the right vision model for skin lesions, chest X-rays, and brain MRIs.' },
  { glyph: 'S', title: 'Smart specialty matching', body: 'When your case needs a human, we extract the specialty from your symptoms and rank verified doctors by fit and rating.' },
  { glyph: 'C', title: 'Curated reading for doctors', body: 'A daily three-topic digest: clinical guidelines, case reports, and recent innovations — kept in your specialty.' },
  { glyph: 'V', title: 'Verified doctor network', body: 'Admins check every credential before a doctor appears in patient search. Pending doctors stay out of the directory.' },
  { glyph: 'H', title: 'Human-in-the-loop', body: 'Critical outputs from vision agents pause for a human validator before reaching the patient. False positives are caught at the source.' },
  { glyph: 'A', title: 'Audit-grade trail', body: 'Every login, claim, note, and verification is recorded. Admins can review the full system activity stream.' },
]

const TECH = [
  'IBM Plex', 'Flask', 'MongoDB', 'PubMedBERT', 'LangGraph',
  'Qdrant', 'BM25', 'Cross-encoder reranker', 'Tailwind v4',
]
