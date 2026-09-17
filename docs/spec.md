# MedAssist — Product Specification

**Status:** Draft v1.0 — 2026-09-17
**Stack (locked):** Flask + MongoDB backend, Vite React frontend, PubMedBERT embeddings, multi-agent orchestration (`agents/` package).
**Build order:** This spec is the source of truth. UI work starts after §5 (API contract) is approved.

---

## 1. Product overview

A multi-agent medical assistant platform that connects patients, doctors, and an AI pipeline (RAG + web search + image triage + decision agent). Patients describe symptoms or upload images; the system triages, retrieves evidence, and either answers or routes the patient to a verified doctor. Doctors get a daily curator feed, a patient queue, and case tools. Admins verify doctor credentials.

### 1.1 Surfaces (in scope)
1. **Auth** — email + password, JWT, password reset, email verify (transactional stub).
2. **Patient app** — chat (text + image), find doctor, request appointment, view records, view curator preview.
3. **Doctor app** — dashboard, patient queue, case notes, daily curator, schedule, profile.
4. **Admin app** — verify doctors, manage users, audit log, system stats.

### 1.2 Out of scope (v1)
- Insurance / billing.
- Real video conferencing (link out to Zoom/Meet).
- Native mobile apps (responsive web only).
- Multi-language (English only).
- Real-time WebSocket streaming (HTTP polling for v1; WebSocket in v1.1).
- HL7 / FHIR integration.

### 1.3 Roles
| Role | Sign-up | First-screen | Permissions |
|---|---|---|---|
| **patient** | open | chat | own chats, own records, request appointments |
| **doctor** | open, **admin-verified** before going live | queue | own queue, case notes, curator, schedule, profile |
| **admin** | seeded only | audit log | everything, plus verify/reject doctors |

### 1.4 Non-functional
- p95 `/api/chat` < 8 s (RAG + LLM cold path); < 2 s when warm-cached.
- Mobile-first responsive (≥ 360 px wide).
- WCAG AA color contrast; monochrome by default (user standing rule).
- All write actions audit-logged.
- No PII in URLs.

---

## 2. Design system

**Aesthetic lock (from user):** monochrome by default. Text labels + outlined buttons. No colored state dots/badges/pills. Color reserved for destructive (`danger`) and warning (`warn`) only.

### 2.1 Tokens
```
--ink:      #111111   (text, primary actions)
--paper:    #ffffff   (card background)
--bg:       #fafafa   (page background)
--line:     #e5e7eb   (borders, dividers)
--muted:    #6b7280   (secondary text)
--warn:     #b45309   (warning text/icon)
--danger:   #b91c1c   (destructive)
--accent:   #111111   (= ink; no separate brand color)
font:      system-ui
radius:    8px small / 12px card / 14px bubble
space:     4 / 8 / 12 / 16 / 24 / 32 / 48 px scale
```

### 2.2 Components (reusable, in `frontend/src/ui/`)
- `Button` — variants: `primary` (filled ink), `outline` (border only), `ghost` (text only), `danger` (filled danger).
- `Input`, `Textarea`, `Select` — outlined, no floating label.
- `Pill` — outline toggle, used for role / specialty chips.
- `Card` — paper bg, 1px line border, 12px radius.
- `Avatar` — initials, monochrome.
- `Tabs` — underline active, no color fill.
- `EmptyState` — icon (monochrome SVG) + headline + CTA.
- `Toast` — top-right, auto-dismiss 4s; variants `info | warn | danger`.
- `Modal` — focus-trapped, ESC closes.
- `Skeleton` — flat gray block, no shimmer.

### 2.3 Layout primitives
- `AppShell` — top bar (brand, search, profile menu) + main + optional left rail.
- `SideNav` — collapsible left rail, monochrome icons.
- `Page` — header (title + actions), body, optional footer.

### 2.4 Iconography
- Lucide icons only, `stroke-width: 1.5`, monochrome.

---

## 3. Screen inventory

Format: `screen_id — role — purpose`. Each lists its components, primary action, empty state, error state.

### 3.1 Auth & onboarding
| ID | Screen | Role | Purpose |
|---|---|---|---|
| S-01 | Sign-in | all | email + password, "Forgot password" link |
| S-02 | Register | all | email, password, role select (patient / doctor) |
| S-03 | Doctor onboarding | doctor | name, specialty, license #, license photo upload, city, bio → status `pending_verification` |
| S-04 | Verify-email stub | all | "click in email" — show success page; backend logs link |
| S-05 | Forgot password | all | email → backend mails reset link |
| S-06 | Reset password (token) | all | new password form |
| S-07 | Logout | all | confirm modal |

### 3.2 Patient app
| ID | Screen | Role | Purpose |
|---|---|---|---|
| P-01 | Chat | patient | text + image input, agent response, citation list, human-validation prompt when flagged |
| P-02 | Chat history (left rail) | patient | thread list, search, new thread |
| P-03 | Find doctor | patient | search by specialty/city; results list + map toggle |
| P-04 | Doctor profile | patient | bio, specialty, rating, "Request appointment" CTA |
| P-05 | Appointment request | patient | date/time/notes → status `pending` |
| P-06 | My appointments | patient | upcoming + past, status badges |
| P-07 | My records | patient | list of case threads the patient opened |
| P-08 | Case detail | patient | full thread, doctor's notes (read-only), attachments |

### 3.3 Doctor app
| ID | Screen | Role | Purpose |
|---|---|---|---|
| D-01 | Dashboard | doctor | today count: pending cases, today's appointments, unread notes |
| D-02 | Patient queue | doctor | assigned + requested patients, filter by status |
| D-03 | Case detail | doctor | patient history, full thread, notes editor, "Send to patient" toggle |
| D-04 | Daily curator | doctor | 3-topic digest (clinical guidelines, case reports, drugs/techniques); refresh button; per-item save-to-reading-list |
| D-05 | Reading list | doctor | saved curator items |
| D-06 | Schedule | doctor | week view, block availability, view booked slots |
| D-07 | Profile | doctor | bio, specialty, city, license status badge |

### 3.4 Admin app
| ID | Screen | Role | Purpose |
|---|---|---|---|
| A-01 | Verify doctors | admin | pending list; review license image; approve / reject with reason |
| A-02 | Users | admin | list + filter (role, status, created date); suspend |
| A-03 | Audit log | admin | paginated event stream with filters (actor, action, target, date) |
| A-04 | System stats | admin | user counts, active doctors, today's chat volume, error rate |

---

## 4. Data model (MongoDB)

Database: `medassist`. Collections below. UUIDs (`_id`) for all documents.

### 4.1 `users`
```
_id: uuid
email: string (unique, lowercase)
name: string
role: 'patient' | 'doctor' | 'admin'
pw_hash: { salt, hash, algo: 'pbkdf2-sha256-120k' }
specialty: string   (doctors)
license_no: string  (doctors)
license_photo_path: string  (doctors, uploaded to /uploads/licenses/)
status: 'active' | 'pending_verification' | 'suspended'
created_at: datetime
email_verified_at: datetime | null
```

### 4.2 `doctors` (profile, joined on user _id)
```
_id: user_id
city: string
bio: string
rating: float (avg of patient ratings, default 0)
cases_count: int
availability: [{ weekday: 0-6, start: "HH:MM", end: "HH:MM" }]
verified_at: datetime | null
verified_by: admin_user_id | null
```

### 4.3 `patients` (profile, joined on user _id)
```
_id: user_id
assigned_doctor_id: user_id | null      (auto-assigned by matching algorithm)
dob: date | null
gender: 'm' | 'f' | 'x' | null
emergency_contact: { name, phone } | null
```

### 4.4 `chats` (case threads)
```
_id: uuid
patient_id: user_id
doctor_id: user_id | null              (assigned when patient requests)
messages: [
  { role: 'patient'|'agent'|'doctor', content, image_path?, agent?, ts }
]
agent_runs: [{ agent, confidence, ts }]    (audit trail of multi-agent decisions)
human_validations: [{ actor_id, decision: 'approve'|'reject', comments, ts }]
status: 'open' | 'awaiting_doctor' | 'closed'
specialty_detected: string | null      (LLM-extracted)
created_at: datetime
updated_at: datetime
```

### 4.5 `appointments`
```
_id: uuid
patient_id, doctor_id
scheduled_at: datetime
duration_min: int (default 30)
notes_from_patient: string
notes_from_doctor: string
status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
created_at: datetime
```

### 4.6 `curator_digests`
```
_id: uuid
doctor_id: user_id
date: "YYYY-MM-DD" (UTC, unique with doctor_id)
topics: [
  { topic, summary, sources: [{ title, url, snippet }] }
]
created_at: datetime
```

### 4.7 `reading_list`
```
_id: uuid
doctor_id: user_id
digest_id, topic_idx
saved_at: datetime
```

### 4.8 `audit_log`
```
_id: uuid
actor_id: user_id | null
action: string (e.g. 'doctor.verified', 'login.failed')
target: { type, id }
ip: string
user_agent: string
detail: object | null
ts: datetime
```
TTL: 365 days.

### 4.9 `sessions` (refresh tokens)
```
_id: uuid
user_id
refresh_token_hash: string
user_agent: string
ip: string
created_at: datetime
expires_at: datetime
revoked_at: datetime | null
```

### 4.10 `password_resets`
```
_id: uuid
user_id
token_hash: string
expires_at: datetime
used_at: datetime | null
```

---

## 5. API contract

Base URL: `/api`. All write endpoints require `Authorization: Bearer <access_jwt>` and CSRF-safe cookie. Refresh via `/api/auth/refresh` (rotating refresh token, opaque cookie).

Conventions:
- JSON in / JSON out; `application/json`.
- Errors: `{ "error": "code", "detail": "human", "request_id": "..." }`.
- Pagination: `?limit=N&before=<iso8601>`, response includes `next_before`.
- Timestamps: ISO 8601 UTC.

### 5.1 Auth (`/api/auth`)
- `POST /register` `{email, password, role, name, specialty?, license_no?, city?, bio?}` → `201 {id, role, status}`; status = `pending_verification` for doctors.
- `POST /login` `{email, password}` → `200 {access_token, user}` + sets refresh cookie.
- `POST /refresh` → rotates tokens.
- `POST /logout` → revokes refresh cookie + clears access token server-side blacklist (short TTL is fine).
- `POST /forgot` `{email}` → `200` always (no enumeration).
- `POST /reset` `{token, new_password}` → `200`.
- `POST /verify-email` `{token}` → `200`.
- `GET /me` → `{id, role, name, specialty, status, ...}`.

### 5.2 Chat (`/api/chat`)
- `POST /chat` `{message_id?, text, conversation_id?, attachments?}` → `200 {conversation_id, message_id, agent, content, citations[], confidence, requires_validation}`. Streaming is v1.1; v1 returns the full response.
- `POST /chat/upload` `multipart` → `{file_id, url}`.
- `POST /chat/:id/validate` `{decision, comments?}` → `200 {ok}`.
- `GET /chat/conversations` → `[{id, title, last_message_at, status}]`.
- `GET /chat/conversations/:id` → thread with messages.

### 5.3 Doctors & matching
- `GET /doctors?specialty=&city=&q=` → list.
- `GET /doctors/:id` → profile + availability + rating.
- `POST /doctors/match` `{symptoms_text}` → `{specialty, doctors: [{id, name, score, reasons[]}]}` — LLM classifies then ranks by rating + cases.

### 5.4 Appointments
- `POST /appointments` `{doctor_id, scheduled_at, notes?}` → `201`.
- `GET /appointments?role=patient|doctor&status=` → list.
- `PATCH /appointments/:id` `{status?, notes_from_doctor?}` → `200`.

### 5.5 Records (patient view of own case threads)
- `GET /records` → list of chats where patient is participant.
- `GET /records/:chat_id` → full thread.

### 5.6 Curator (doctor only)
- `GET /curator/today` → today's digest (cached).
- `POST /curator/refresh` → regenerate now.
- `GET /curator/history?from=&to=` → past digests.
- `POST /curator/save` `{digest_id, topic_idx}` → `201`.
- `GET /reading-list` → saved items.

### 5.7 Admin
- `GET /admin/doctors/pending` → list.
- `POST /admin/doctors/:id/verify` `{decision: 'approve'|'reject', reason?}` → `200`.
- `GET /admin/users?role=&status=&q=` → list.
- `POST /admin/users/:id/suspend` `{reason}` → `200`.
- `GET /admin/audit?actor=&action=&from=&to=&limit=&before=` → events.
- `GET /admin/stats` → `{users, doctors, chats_today, errors_today}`.

### 5.8 Health
- `GET /health` → `{status, mongo, ts}`.
- `GET /ready` → adds model warmup check (PubMedBERT, reranker).

---

## 6. Multi-agent integration

The existing `agents/agent_decision.process_query(query)` is the single entry point. The Flask backend wraps it; never bypasses it.

### 6.1 Routing rules (extension of existing)
- text + no image → `conversation | rag | web_search` per current logic.
- text + image → current CV branch (brain/chest/skin).
- **NEW:** when conversation confidence falls below threshold OR user says "I need a doctor" / "this isn't helping", the orchestrator returns `requires_validation=true` AND `recommended_specialty=...`. The UI uses this to surface P-03 (Find doctor).

### 6.2 Specialty extraction
- For every chat message, run a small LLM call (same model, temp 0.1, ≤ 200ms) to extract: `{specialty, urgency: 'low'|'medium'|'high', red_flags: []}`.
- Cached on the chat document; used by `POST /doctors/match`.
- New module: `agents/specialty_extractor.py`, one function `extract(query: str) -> dict`.

### 6.3 Curation
- Existing `WebSearchProcessor.process_web_search_results` already used in backend (verified working). v1 spec: 3 topics (guidelines / case reports / drugs+techniques). v1.1: configurable per doctor.

### 6.4 Audit hooks
- Every `process_query` call records `agent_runs` on the chat doc.
- Every doctor verification, every login, every case close → `audit_log`.

---

## 7. Implementation plan

Phases — each ships to localhost, no orphan code.

| # | Phase | Deliverable | Done when |
|---|---|---|---|
| 0 | **Now** | Spec approved | this doc reviewed |
| 1 | Auth hard | JWT login/register/refresh/forgot/reset, doctor onboarding → `pending_verification`, email-verify stub | curl test script green |
| 2 | Patient core | chat (already wired), history rail, conversation API, image upload, human-validation UI | patient can register → chat → upload → see history |
| 3 | Doctor core | dashboard, queue, case detail with notes, schedule CRUD | doctor can see assigned patients and write notes |
| 4 | Curator + reading list | daily digest (already works), history view, save | doctor sees today's digest and can save items |
| 5 | Doctor discovery | doctor directory, profile, request appointment, my appointments | patient can find and book a doctor |
| 6 | Specialty matcher | `specialty_extractor` + `/doctors/match` | `/match` returns ranked list from symptoms text |
| 7 | Admin | verify queue, user mgmt, audit log, stats | admin can approve a doctor end-to-end |
| 8 | Polish | responsive, accessibility, error toasts, loading skeletons | lighthouse mobile ≥ 90 |
| 9 | Docker + CI | Dockerfile for Flask + React, GH Actions build matrix | green build on push |

Each phase = 1 commit, demoable locally before moving on.

---

## 8. Open questions (resolve before phase 2)
1. **Map provider** — defaulted to OSM (no key, free). Confirm or switch to Mapbox/Google.
2. **Patient↔doctor matching** — defaulted to symptom-based LLM. Confirm or switch to geo-only / manual.
3. **Email service** — defaulted to a console-logging stub for dev (real SMTP deferred to deploy). Confirm.
4. **File storage** — defaulted to local `/uploads/` (current pattern). Confirm or switch to S3.
5. **Push notifications** — none in v1. Confirm.
6. **HIPAA / data residency** — out of scope; user understands this is a local dev build, not deploy-ready. Confirm.

---

## 9. Repo layout (target)

```
multi-agent-orchestration/
├── backend/
│   ├── app.py             # Flask routes
│   ├── auth.py            # JWT, password, sessions
│   ├── db.py              # Mongo client, indexes
│   ├── audit.py           # audit_log helper
│   └── services/
│       ├── chat.py        # wraps process_query
│       ├── doctors.py     # directory + matching
│       ├── appointments.py
│       └── curator.py
├── agents/                # unchanged, plus specialty_extractor.py
├── frontend/
│   └── src/
│       ├── ui/            # design-system components
│       ├── pages/         # one folder per role
│       │   ├── auth/
│       │   ├── patient/
│       │   ├── doctor/
│       │   └── admin/
│       ├── App.jsx
│       ├── api.jsx        # fetch wrapper, auth context
│       ├── router.jsx     # React Router
│       └── index.css      # tokens + base
├── docs/
│   ├── spec.md            # this file
│   └── api.md             # auto-generated from OpenAPI
├── tests/
│   ├── test_auth.py
│   ├── test_chat.py
│   └── test_curator.py
└── docker-compose.yml
```
