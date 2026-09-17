# Frontend audit

## CRITICAL

### C1. api.jsx:37 — Authorization header is corrupted; auto-refresh is broken

The retry header has literal `***` instead of `Bearer ${token}`:

```
const headers2 = { ...headers, Authorization: *** ${j.access_token}` }
```

This sends a syntactically invalid `Authorization` value, so the server (which expects `Bearer <token>`) will reject every retried request. Net effect: any 401 that triggers the refresh path fails the user request — the user sees an error toast/inline error instead of a transparent re-auth.

This also masks C3 and C4 below: they look harmless until the refresh path is hit, then they get worse.

Fix: `Authorization: Bearer ${j.access_token}` (with closing backtick, no stray asterisks).

### C2. api.jsx:22-49 — Concurrent 401s trigger N refresh calls (refresh storm)

`/auth/refresh` is called inside the per-request `.then` handler with no shared inflight promise. If two parallel requests both 401 (e.g. `loadThreads()` + `loadConv()` in `PatientChat` on a stale token), each fires its own refresh. Outcomes:

- Backend may rotate the refresh cookie (typical), invalidating the first response's `access_token` by the time the second fires — one of the retries lands with a stale token and 401s again. User sees a flaky "works after refresh, fails on next page" experience.
- Two POSTs to `/auth/refresh` means two network round-trips on every token expiry, visible as a noticeable lag on slow connections.

This is the textbook "refresh once, share the promise" pattern.

Fix sketch (minimal):
```js
let refreshing = null
// inside apiFetch, r.status === 401 branch:
const refreshOnce = async () => {
  const rr = await fetch(API + '/auth/refresh', { method: 'POST', credentials: 'include' })
  if (!rr.ok) throw new Error(...)
  const j = await rr.json()
  localStorage.setItem('access_token', j.access_token)
  return j.access_token
}
const newToken = refreshing || (refreshing = refreshOnce().finally(() => { refreshing = null }))
```
Then retry `doFetch()` with the new token in the same way. This collapses N concurrent 401s into one refresh.

### C3. App.jsx + api.jsx — Stale-token-on-deleted-user is a soft infinite redirect loop

Flow: server deletes the user → existing `access_token` still in `localStorage`. `apiFetch('/auth/me')` succeeds (token valid by signature) but the response is e.g. `{user: null}` or returns 401 → `setUser(null)`, `setLoading(false)`. Then:

- `HomeOrRole` sees `!user` → renders `<Landing />`. OK.
- If the user navigates to a protected route, `Protected` redirects to `/login`. OK.
- BUT: after `logout()` (line 80), `try { await apiFetch('/auth/logout', ...) } catch {}` — `apiFetch` will call `/auth/refresh` if `/auth/logout` 401s. That fires a refresh on a token we are deleting. If the refresh succeeds and stores a new `access_token`, the next protected-route call still works as the now-deleted user.

More serious: `HomeOrRole:96` reads `localStorage.getItem('onboarded_' + user.id)` without checking `user.id` exists. If `user.id` is undefined (server returned a shape change), the localStorage key is `'onboarded_undefined'`, which every deleted user would share. Not a leak in itself but means onboarding can skip for an unrelated user.

Fix: on 401 in `apiFetch('/auth/me')` during boot, clear `access_token` AND short-circuit to `setUser(null)`. Right now `apiFetch` *will* try the refresh path for `/auth/me` on 401 (`path.includes('/auth/')` only excludes `/auth/` prefix, not `/auth/me`... actually `'/auth/me'.includes('/auth/')` is true, so it IS excluded — verify). Looking again: yes, line 22 excludes any path containing `/auth/`, so `/auth/me` won't refresh. Good. But `/auth/refresh` itself returning 401 is silently swallowed with `unauthorized` error which then triggers `setUser(null)` — that's correct.

Net: this is a MEDIUM, not CRITICAL, on closer look. Demoting.

## HIGH

### H1. api.jsx:22-49 — Retry uses `data` error, not the retried request's body

The 401 → refresh → retry-401 path throws `HTTP ${rr2.status}` (line 40-46), which is correct. But before that, the `!rr.ok` branch for the *refresh* response (line 27-34) reads from `rr`'s body — that part is fine.

However, there's a subtler bug: when the **original** request returns 200 after refresh (line 47-48), if `ct2` says JSON but the body is empty/malformed, `rr2.json()` rejects and the whole `.then` chain rejects with a TypeError instead of the real backend error. `apiFetch` has no `.catch` on the inner `.json()` for `rr2`.

### H2. App.jsx:96 — `onboarded_${user.id}` assumes `id` field, no fallback to `_id`

`Onboarding.jsx:47` defends against `user.id || user._id`. `App.jsx:96` doesn't — it uses only `user.id`. If the backend ever returns `_id` (older payloads, see comment in Onboarding), `localStorage.getItem('onboarded_undefined')` will be `'1'` for *any* such user (shared key), or `'null'` for the common case. Effect: user is silently treated as "onboarded" (or not) based on someone else's flag.

### H3. PatientChat.jsx — Optimistic bubble + server reload race creates a double-render

Sequence: `send()` appends an optimistic bubble (line 106-115), POSTs `/chat`, then calls `loadConv(resp.conversation_id)` (line 125). `loadConv` calls `setConv(loaded)`, replacing the optimistic state. Good.

But: the optimistic bubble uses `previewUrl = uploaded?.url || blobUrl`. If upload succeeded, it sets the SERVER url. After `loadConv` reloads, the server bubble has the server URL — same URL, same render. OK.

**However**, line 123 clears `setImage(null); setImagePreview(null)` AFTER the API call but BEFORE the bubble is rendered from `loadConv`. The optimistic bubble already used `blobUrl`. `setImagePreview(null)` revokes (well, doesn't revoke — `revokeObjectURL` is never called for `blobUrl`). Result: the optimistic bubble's `<img src={blobUrl}>` continues to work for the lifetime of the page, but the blob URL is leaked. Minor.

### H4. PatientChat.jsx — `image` state cleared on `useEffect([active])` race

When switching to a new thread, `setConv(null)` runs. If the user was mid-send, the in-flight optimistic bubble's `image_url` is the blob URL stored in the React state tree — which got cleared. On the *new* thread, `loadConv(newId)` overwrites with server data. OK.

The bug: if `send()` is in-flight and `setActive(resp.conversation_id)` runs (line 122) **before** the awaited `loadConv(resp.conversation_id)` (line 125), the `useEffect([active])` at line 60 fires with the new id, runs `loadConv(newId)` AGAIN (race with the one inside `send`). Two `loadConv` calls in flight. Whichever lands second wins. If the second lands AFTER the user's manual click on a thread, the manual click is overwritten by `setActive(newId)`. Subtle.

Fix: remove `await loadConv(resp.conversation_id)` from inside `send` and rely on the `useEffect([active])` to load. One load path, no race.

### H5. PatientChat.jsx — `setBusy(false)` lost on validation failure path

`validate()` (line 130-136) doesn't touch `busy`. But it calls `loadConv` which sets `conv` — if a `/chat` request is in flight (validation interrupt), both write to `conv`. Last-write-wins; user sees whichever finished last. No setBusy divergence here because `validate` never sets busy. OK.

But: `validate()` catches errors silently and only sets `err`. No success indicator. Acceptable.

### H6. VerifyEmail.jsx — Side effects in render body

Line 10-21: `if (status === 'pending') { setStatus('verifying'); import(...).then(...) }` runs during render. In React 18/19 StrictMode (which Vite scaffolds by default), renders run twice. Result: two `apiFetch('/auth/verify-email', ...)` calls fire, double-counting against any rate limit and double-rendering the "Verifying…" state.

Fix: move into `useEffect(() => { ... }, [])`.

### H7. AdminStats.jsx:34-41 — `Promise.all` shows spinner only if ALL fail

If any of the three fetches rejects, `Promise.all` rejects and `setErr(e.message)` runs (line 40). But the success path requires all three. If `/admin/audit` 500s, the user can't see stats at all even though `/admin/stats` and `/admin/doctors/pending` worked. Acceptable trade-off; flagging.

### H8. DoctorCurator.jsx:42 — Save button doesn't refresh UI

`save()` POSTs to `/curator/save` but doesn't update local state. If the saved-topic indicator is intended (not in current UI), it's missing. No error toast on save failure (line 22-24 silently sets `err`). MEDIUM, not HIGH.

## MEDIUM

### M1. AuthSplit.jsx — Sign-in mode leaves the password visible after tab switch

Switching tabs calls `setMode(...)` but not `setPassword('')`. Password is retained when toggling tabs. (Signup already clears on success, line 43.) Minor UX — type a long password, hit "create account" tab, the password is still there. Not a security issue (input value is local), just confusing.

### M2. AuthSplit.jsx:33 — `license_no` sent even for patient signup

`register({ email, password, name, role, specialty, license_no: licenseNo, city })` always sends `license_no`, `specialty`, `city`. The doctor-only fields are hidden by `{role === 'doctor' && ...}` (line 124), so `licenseNo` is `''`, `specialty` is the hidden default `'cardiology'`, `city` is `''`. Sending `license_no: ''` for a patient is harmless but noisy on the wire.

### M3. App.jsx:30-44 — Topbar NavLink `end` prop missing

`<NavTab to="/admin">System</NavTab>` will mark itself active on `/admin/users`, `/admin/pending`, `/admin/audit`, etc. because `NavLink` matches by prefix by default. Result: clicking "Users" leaves "System" highlighted.

Fix: `end` prop on the `/admin` link, or restructure so each admin route has its own topbar entry (current code lists them, but the `/admin` entry stays highlighted incorrectly).

### M4. ui.css:105 — Focus ring color uses literal hex, not the `--color-accent` token

```
.input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(30,64,175,0.15); }
```

Hardcoded `rgba(30,64,175,0.15)` (= accent at 15% alpha). If someone changes `--color-accent`, the focus ring drifts. Use `color-mix(in srgb, var(--color-accent) 15%, transparent)` (modern CSS) or a dedicated `--color-accent-soft` token.

### M5. ui.css:101-104 — `.input` has no `:focus-visible` distinction

`:focus` is used; mouse-clicks trigger the same ring as keyboard-tab. `:focus-visible` would suppress the ring for mouse users while keeping it for keyboard nav. A11y minor — keyboard users benefit, mouse users get a slightly cleaner UI.

### M6. ui.css:80-96 — No focus ring on buttons

`.btn:focus` not defined. Tab-navigating to "Sign in" → no visible focus indicator. Add `.btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }`.

### M7. ui.css — `.form-card .err` (line 160-164) and `.form-card .ok` (line 251-255) have a `bubble-in` animation, but `bubble-in` is not defined anywhere in the file

Grep: no `@keyframes bubble-in` in `ui.css`. Yet `.err` and `.ok` reference it. The animation silently does nothing (browser logs a "unknown animation name" warning). Probably left over from a previous refactor. Remove the reference.

### M8. PatientChat.jsx — `<img alt="" />` (line 35) is screen-reader-friendly but stripping `alt=""` discards info

`m.image_url` images get empty alt, fine for decorative patient-shared images. But the chat image is the user's *own* message — they're uploading a medical photo to show the agent. Decorative alt is defensible. LOW.

### M9. PatientChat.jsx:198 — Button label swaps `📎 image` ↔ `✓ image`

The label toggle uses an emoji + text combo. Emojis render inconsistently across browsers. LOW (cosmetic).

### M10. AdminUsers.jsx:13 — `useEffect(load, [role, status])` reloads on role/status change but q (search) does not

`q` is local state that only triggers reload via Enter key (line 48). Intentional. But there's no debounce, and "Apply" button is a separate path (line 62) that re-runs `load()` with stale `q`. OK.

### M11. ui.css:312 — `.bubble img { max-width: 240px }` clips tall images

`max-width: 240px` but no `max-height`. A 240×2000 chest x-ray preview would blow out the layout. Add `max-height: 320px` + `object-fit: contain`.

## LOW

### L1. App.jsx:62 — `<><TopBar />{children}</></>` shows TopBar even for the loader

`Protected` returns `<div>Loading…</div>` (line 59) without TopBar — OK. But on the post-load no-user path, `<Navigate to="/login" replace />` runs; on stale-token-with-still-valid-`/auth/me` path, the user sees the topbar with no nav tabs (no role). Minor — empty nav looks broken.

### L2. ui.css — `.thinking-meta` shows `({text.length} chars)` — character count leaks internals

Fine, just verbose. LOW.

### L3. AdminStats.jsx:53 — "No patient chats today" pushes an action item with `urgent: false`

Showing an "action" item for zero activity is contradictory UX (action with no action). LOW (product call).

### L4. api.jsx — No timeout on `fetch`

`apiFetch` has no AbortController/timeout. A hung server keeps the user on a spinner forever. Out of scope of this audit but worth noting.

### L5. PatientChat.jsx:175 — `<Spinner />` inside a `.bubble bubble-agent` makes the bubble itself animated; no `aria-busy="true"` on the bubble or chat region

Screen readers don't know the chat is loading. LOW (a11y).

### L6. DoctorCurator.jsx:30 — Spinner button text replaces "Refresh" label

`<Button variant="outline" onClick={...} disabled={busy}>{busy ? <Spinner /> : 'Refresh'}</Button>` — when busy, the button has only a spinner and no label. Screen readers announce "loading" with no context. LOW.

### L7. Onboarding.jsx:42 — `useEffect(() => { if (!user) nav('/login') }, [user, nav])` runs before `if (!user) return null`

`useEffect` fires AFTER render, so this is fine. But the initial render with `user=null` flashes the onboarding UI for one frame. LOW (visual only).

## Verifications

- Line numbers verified by reading the source files directly, not by re-stating memory.
- `api.jsx:37` corruption verified at the byte level (python repr shows literal `***`).
- `bubble-in` keyframe absence verified by grep across `ui.css`.
- Onboarding/App.jsx `onboarded_` key divergence verified by reading both files.
- Stale-token race: walked `HomeOrRole` and `Protected` to confirm `/auth/me` is excluded from the auto-refresh branch (line 22 includes-check matches `/auth/me`), so no refresh-storm on boot; the soft-loop concern is downgraded.

## Fixes I'd ship first

1. **C1** — One-character fix, restores auto-refresh entirely. Unblocks H1 testing.
2. **C2** — Shared inflight promise. Standard pattern; ~10 lines.
3. **H6** — Move VerifyEmail side effect to `useEffect`. 3-line change.
4. **H4** — Drop the redundant `await loadConv(resp.conversation_id)` inside `send`; let the existing `useEffect([active])` do it.
5. **M3** — Add `end` to `/admin` NavLink. One prop.

Skipped: refresh-rotation handling, server-side cookie re-issuance, network timeouts (L4 — real but out of scope for "audit", and the codebase has no precedent for AbortController; adding it everywhere is a bigger change than warranted here). Add a fetch helper with `AbortController.timeout` when the next page that touches long-running requests lands.