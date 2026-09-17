"""Flask app — MedAssist API.

Implements spec §5 endpoints. Phases 1-2: auth (hard) + patient core.
"""
from __future__ import annotations

import hashlib
import os
import secrets
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from flask import Flask, jsonify, make_response, request, send_from_directory
from flask_cors import CORS

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from config import Config  # noqa: E402
from agents.agent_decision import process_query  # noqa: E402

from . import audit, db as dbm  # noqa: E402
from .auth import (  # noqa: E402
    check_pw, hash_pw, issue_access_token, require_auth, rotate_refresh_session,
    issue_refresh_session,
)

app = Flask(__name__)
CORS(app, supports_credentials=True,
     origins=["http://localhost:5173", "http://127.0.0.1:5173"])

COOKIE_NAME = "rt"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "0") == "1"
COOKIE_SAMESITE = "Lax"
REFRESH_TTL = int(os.getenv("JWT_REFRESH_TTL", "2592000"))

UPLOAD_DIR = ROOT / "uploads"
LICENSE_DIR = UPLOAD_DIR / "licenses"
LICENSE_DIR.mkdir(parents=True, exist_ok=True)

config = Config()


# ponytail: LLM responses sometimes include reasoning wrapped in <<think>>...
# </<think>>. We split it out so the chat UI can collapse it behind a toggle,
# rather than rendering it as part of the visible answer.
import re as _re
_THINK_RE = _re.compile(r"<think>(.*?)</think>", _re.DOTALL | _re.IGNORECASE)


def _split_thinking(raw: str) -> dict:
    """Return {answer, thinking}: answer strips <think> blocks; thinking holds them."""
    if not isinstance(raw, str):
        raw = str(raw)
    blocks = _THINK_RE.findall(raw)
    thinking = "\n\n".join(b.strip() for b in blocks).strip()
    answer = _THINK_RE.sub("", raw).strip()
    return {"answer": answer, "thinking": thinking}


# ------------ helpers ------------
def _set_refresh_cookie(resp, token: str) -> None:
    resp.set_cookie(COOKIE_NAME, token, httponly=True, secure=COOKIE_SECURE,
                    samesite=COOKIE_SAMESITE, max_age=REFRESH_TTL, path="/api/auth")


def _clear_refresh_cookie(resp) -> None:
    resp.delete_cookie(COOKIE_NAME, path="/api/auth")


def _public_user(u: dict) -> dict:
    return {"id": u["_id"], "email": u["email"], "role": u["role"],
            "name": u["name"], "status": u.get("status", "active"),
            "specialty": u.get("specialty", "")}


# ------------ startup ------------
def _seed_admin() -> None:
    if dbm.users().find_one({"role": "admin"}):
        return
    admin_email = os.getenv("ADMIN_EMAIL", "admin@medassist.local")
    admin_pw = os.getenv("ADMIN_PASSWORD", "admin1234")
    aid = str(uuid.uuid4())
    dbm.users().insert_one({
        "_id": aid, "email": admin_email, "name": "Admin",
        "role": "admin", "pw_hash": hash_pw(admin_pw),
        "status": "active", "created_at": datetime.now(timezone.utc),
        "email_verified_at": datetime.now(timezone.utc),
    })
    # ponytail: don't log the cleartext password. Log only the email; the
    # admin must read ADMIN_PASSWORD from the env or rotate on first login.
    app.logger.warning("seeded admin %s (rotate password on first login)", admin_email)


with app.app_context():
    dbm.ensure_indexes()
    _seed_admin()


# ------------ health ------------
@app.get("/api/health")
def health():
    try:
        dbm.client().admin.command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False
    # ponytail: do NOT include MONGO_URI in the health response — leaks infra
    # topology (auth creds in URI strings, replica set members, hostnames).
    return jsonify({"status": "ok" if mongo_ok else "degraded",
                    "mongo_ok": mongo_ok,
                    "ts": datetime.now(timezone.utc).isoformat()})


# ------------ auth ------------
@app.post("/api/auth/register")
def register():
    body = request.get_json(force=True, silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    name = (body.get("name") or "").strip() or email.split("@")[0]
    role = body.get("role") or "patient"
    if not email or len(password) < 8 or role not in {"patient", "doctor"}:
        return jsonify({"error": "invalid_input",
                        "detail": "email, password>=8, role in {patient, doctor}"}), 400
    if dbm.users().find_one({"email": email}):
        return jsonify({"error": "email_taken"}), 409

    uid = str(uuid.uuid4())
    status = "pending_verification" if role == "doctor" else "active"
    user_doc = {
        "_id": uid, "email": email, "name": name, "role": role,
        "pw_hash": hash_pw(password), "status": status,
        "created_at": datetime.now(timezone.utc),
        "email_verified_at": None,
    }
    if role == "doctor":
        user_doc.update({
            "specialty": (body.get("specialty") or "").strip(),
            "license_no": (body.get("license_no") or "").strip(),
        })
    dbm.users().insert_one(user_doc)

    if role == "doctor":
        dbm.doctors().insert_one({
            "_id": uid, "email": email, "name": name,
            "specialty": user_doc["specialty"],
            "city": (body.get("city") or "").strip(),
            "bio": (body.get("bio") or "").strip(),
            "rating": 0.0, "cases_count": 0,
            "availability": [], "verified_at": None,
        })
    else:
        dbm.patients().insert_one({
            "_id": uid, "email": email, "name": name,
            "assigned_doctor_id": None, "dob": None, "gender": None,
            "emergency_contact": None,
        })

    tok = secrets.token_urlsafe(32)
    dbm.email_verifications().insert_one({
        "user_id": uid, "token_hash": hashlib.sha256(tok.encode()).hexdigest(),
        "expires_at": time.time() + 86400, "used_at": None,
    })
    from .email import send
    send(email, "Verify your MedAssist email", "Click the link.",
         link=f"http://localhost:5173/verify?token={tok}")

    audit.write("user.registered", actor_id=uid, request=request,
                target={"type": "user", "id": uid}, detail={"role": role})
    return jsonify({"id": uid, "role": role, "status": status}), 201


@app.post("/api/auth/login")
def login():
    body = request.get_json(force=True, silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    u = dbm.users().find_one({"email": email})
    if not u or not check_pw(password, u["pw_hash"]):
        audit.write("login.failed", actor_id=u["_id"] if u else None, request=request,
                    target={"type": "user", "id": email})
        return jsonify({"error": "invalid_credentials"}), 401
    # ponytail: doctors with status=pending_verification cannot sign in
    # until an admin verifies them. Patients default to active and skip this.
    if u.get("status") == "pending_verification":
        return jsonify({"error": "account_pending_verification"}), 403
    if u.get("status") == "suspended":
        return jsonify({"error": "account_suspended"}), 403
    access = issue_access_token(u["_id"], u["role"])
    refresh = issue_refresh_session(u["_id"], request.remote_addr or "",
                                    request.headers.get("User-Agent", ""))
    audit.write("login.success", actor_id=u["_id"], request=request,
                target={"type": "user", "id": u["_id"]})
    resp = make_response(jsonify({"access_token": access, "user": _public_user(u)}))
    _set_refresh_cookie(resp, refresh)
    return resp


@app.post("/api/auth/refresh")
def refresh():
    tok = request.cookies.get(COOKIE_NAME)
    if not tok:
        return jsonify({"error": "no_refresh"}), 401
    # ponytail: atomic validate-and-revoke. The previous non-atomic
    # find_one + revoke allowed two concurrent refreshes to both succeed,
    # leaving two valid refresh tokens for one session.
    s = rotate_refresh_session(tok)
    if not s:
        return jsonify({"error": "invalid_refresh"}), 401
    u = dbm.users().find_one({"_id": s["user_id"]})
    if not u or u.get("status") not in (None, "active"):
        return jsonify({"error": "invalid_refresh"}), 401
    new_refresh = issue_refresh_session(u["_id"], request.remote_addr or "",
                                        request.headers.get("User-Agent", ""))
    access = issue_access_token(u["_id"], u["role"])
    audit.write("token.refreshed", actor_id=u["_id"], request=request,
                target={"type": "user", "id": u["_id"]})
    resp = make_response(jsonify({"access_token": access}))
    _set_refresh_cookie(resp, new_refresh)
    return resp


@app.post("/api/auth/logout")
def logout():
    tok = request.cookies.get(COOKIE_NAME)
    if tok:
        # ponytail: rotate_refresh_session atomically revokes the token.
        # We don't care about the returned session doc on logout.
        rotate_refresh_session(tok)
    resp = make_response(jsonify({"ok": True}))
    _clear_refresh_cookie(resp)
    return resp


@app.get("/api/auth/me")
def me():
    u, err = require_auth(request)
    if err:
        return err
    return jsonify(_public_user(u))


@app.post("/api/auth/forgot")
def forgot():
    body = request.get_json(force=True, silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    u = dbm.users().find_one({"email": email})
    if u:
        tok = secrets.token_urlsafe(32)
        dbm.password_resets().insert_one({
            "user_id": u["_id"],
            "token_hash": hashlib.sha256(tok.encode()).hexdigest(),
            "expires_at": time.time() + 3600, "used_at": None,
        })
        from .email import send
        send(email, "Reset your MedAssist password", "Click to reset.",
             link=f"http://localhost:5173/reset?token={tok}")
        audit.write("password.reset.requested", actor_id=u["_id"], request=request,
                    target={"type": "user", "id": u["_id"]})
    return jsonify({"ok": True})


@app.post("/api/auth/reset")
def reset_password():
    body = request.get_json(force=True, silent=True) or {}
    tok = body.get("token") or ""
    new_pw = body.get("password") or ""
    if len(new_pw) < 8:
        return jsonify({"error": "invalid_input", "detail": "password>=8"}), 400
    token_hash = hashlib.sha256(tok.encode()).hexdigest()
    rec = dbm.password_resets().find_one({"token_hash": token_hash, "used_at": None})
    if not rec or rec.get("expires_at", 0) < time.time():
        return jsonify({"error": "invalid_token"}), 400
    dbm.users().update_one({"_id": rec["user_id"]}, {"$set": {"pw_hash": hash_pw(new_pw)}})
    dbm.password_resets().update_one({"_id": rec["_id"]}, {"$set": {"used_at": time.time()}})
    audit.write("password.reset.completed", actor_id=rec["user_id"], request=request,
                target={"type": "user", "id": rec["user_id"]})
    return jsonify({"ok": True})


@app.post("/api/auth/verify-email")
def verify_email():
    body = request.get_json(force=True, silent=True) or {}
    tok = body.get("token") or ""
    token_hash = hashlib.sha256(tok.encode()).hexdigest()
    rec = dbm.email_verifications().find_one({"token_hash": token_hash, "used_at": None})
    if not rec or rec.get("expires_at", 0) < time.time():
        return jsonify({"error": "invalid_token"}), 400
    dbm.users().update_one({"_id": rec["user_id"]},
                           {"$set": {"email_verified_at": datetime.now(timezone.utc)}})
    dbm.email_verifications().update_one({"_id": rec["_id"]}, {"$set": {"used_at": time.time()}})
    audit.write("email.verified", actor_id=rec["user_id"], request=request,
                target={"type": "user", "id": rec["user_id"]})
    return jsonify({"ok": True})


# ------------ chat ------------
# ponytail: upload size cap is enforced both at the parser level (max
# content-length) and at the file-system level (file size after save).
# 5 MB matches the APIConfig.max_image_upload_size in the legacy config.
app.config.setdefault("MAX_CONTENT_LENGTH", 5 * 1024 * 1024)


@app.post("/api/chat/upload")
def chat_upload():
    u, err = require_auth(request)
    if err:
        return err
    if "file" not in request.files:
        return jsonify({"error": "no_file"}), 400
    f = request.files["file"]
    # ponytail: also check the actual MIME magic bytes. A user can rename
    # `evil.exe` to `evil.png` and bypass the extension check.
    head = f.read(8); f.seek(0)
    is_png = head.startswith(b"\x89PNG\r\n\x1a\n")
    is_jpg = head.startswith(b"\xff\xd8\xff")
    ext = (f.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in {"png", "jpg", "jpeg"} or not (is_png or is_jpg):
        return jsonify({"error": "bad_ext", "detail": "png/jpg/jpeg only"}), 400
    name = f"{uuid.uuid4()}.{ext}"
    dest = UPLOAD_DIR / name
    f.save(dest)
    # ponytail: track uploader so /uploads/<file_id> can auth before the
    # message is POSTed to /chat (optimistic UI shows the image first).
    dbm.upload_registry().insert_one({
        "file_id": name, "uploader_id": u["_id"],
        "role": u["role"], "created_at": datetime.now(timezone.utc),
    })
    return jsonify({"file_id": name, "url": f"/uploads/{name}"})


@app.post("/api/chat")
def chat():
    u, err = require_auth(request)
    if err:
        return err
    body = request.get_json(force=True, silent=True) or {}
    text = (body.get("text") or "").strip()
    conv_id = body.get("conversation_id")
    image_file_id = body.get("image_file_id")
    if not text and not image_file_id:
        return jsonify({"error": "empty_message"}), 400

    if conv_id:
        conv = dbm.chats().find_one({"_id": conv_id, "patient_id": u["_id"]})
        if not conv:
            return jsonify({"error": "conversation_not_found"}), 404
    else:
        conv_id = str(uuid.uuid4())
        dbm.chats().insert_one({
            "_id": conv_id, "patient_id": u["_id"], "doctor_id": None,
            "messages": [], "agent_runs": [],
            "human_validations": [], "status": "open",
            "specialty_detected": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

    try:
        if image_file_id:
            img_path = UPLOAD_DIR / image_file_id
            if not img_path.exists():
                return jsonify({"error": "image_not_found"}), 400
            # ponytail: reject obviously corrupt images here (wrong magic
            # bytes) with a clear 400 so the UI doesn't show "agent failed"
            # for what's really a user-supplied bad file.
            with open(img_path, "rb") as _f:
                head = _f.read(12)
            if not (head.startswith(b"\x89PNG\r\n\x1a\n") or head.startswith(b"\xff\xd8\xff")):
                return jsonify({"error": "image_format_invalid",
                                "reason": "file is not a valid PNG or JPEG"}), 400
            out = process_query({"text": text, "image": str(img_path)})
            image_url = f"/uploads/{image_file_id}"
        else:
            out = process_query(text)
            image_url = None
        agent_name = out.get("agent_name", "")
        content = _split_thinking(out["messages"][-1].content)
    except Exception as e:
        # ponytail: full exception text in detail leaks internals (paths,
        # URLs, sometimes key fragments). Log full server-side; return a
        # stable error code plus a short reason so the UI can render a
        # useful message (instead of a generic "agent failed").
        app.logger.exception("chat agent error")
        detail = {"error": str(e)[:200]}
        audit.write("chat.agent_error", actor_id=u["_id"], request=request,
                    target={"type": "chat", "id": conv_id}, detail=detail)
        return jsonify({"error": "agent_failed", "reason": detail["error"]}), 500

    now = datetime.now(timezone.utc)
    user_msg = {"role": "patient", "content": text, "image_url": image_url, "ts": now}
    agent_msg = {"role": "agent", "content": content["answer"], "thinking": content["thinking"],
                 "agent": agent_name, "ts": now}
    dbm.chats().update_one(
        {"_id": conv_id},
        {"$push": {"messages": {"$each": [user_msg, agent_msg]},
                   "agent_runs": {"$each": [{"agent": agent_name, "ts": now}]}},
         "$set": {"updated_at": now}},
    )
    audit.write("chat.message", actor_id=u["_id"], request=request,
                target={"type": "chat", "id": conv_id},
                detail={"agent": agent_name, "has_image": bool(image_url)})
    return jsonify({
        "conversation_id": conv_id,
        "message_id": str(uuid.uuid4()),
        "agent": agent_name,
        "content": content["answer"],
        "thinking": content["thinking"],
        "requires_validation": agent_name.endswith("HUMAN_VALIDATION"),
    })


@app.post("/api/chat/<conv_id>/validate")
def chat_validate(conv_id):
    u, err = require_auth(request)
    if err:
        return err
    body = request.get_json(force=True, silent=True) or {}
    decision = body.get("decision")
    comments = body.get("comments", "")
    if decision not in {"approve", "reject"}:
        return jsonify({"error": "invalid_decision"}), 400
    conv = dbm.chats().find_one({"_id": conv_id, "patient_id": u["_id"]})
    if not conv:
        return jsonify({"error": "not_found"}), 404
    dbm.chats().update_one({"_id": conv_id},
                           {"$push": {"human_validations": {
                               "actor_id": u["_id"], "decision": decision,
                               "comments": comments, "ts": datetime.now(timezone.utc)}}})
    audit.write("chat.validated", actor_id=u["_id"], request=request,
                target={"type": "chat", "id": conv_id}, detail={"decision": decision})
    return jsonify({"ok": True})


@app.get("/api/chat/conversations")
def chat_list():
    u, err = require_auth(request)
    if err:
        return err
    out = []
    for c in dbm.chats().find({"patient_id": u["_id"]}).sort("updated_at", -1).limit(100):
        last = c["messages"][-1]["content"][:80] if c.get("messages") else ""
        out.append({"id": c["_id"], "title": last or "(empty)",
                    "status": c.get("status"),
                    "updated_at": c["updated_at"].isoformat()})
    return jsonify(out)


@app.get("/api/chat/conversations/<conv_id>")
def chat_get(conv_id):
    u, err = require_auth(request)
    if err:
        return err
    conv = dbm.chats().find_one({"_id": conv_id, "patient_id": u["_id"]})
    if not conv:
        return jsonify({"error": "not_found"}), 404
    for k in ("created_at", "updated_at"):
        conv[k] = conv[k].isoformat() if isinstance(conv.get(k), datetime) else conv.get(k)
    for m in conv.get("messages", []):
        m["ts"] = m["ts"].isoformat() if isinstance(m.get("ts"), datetime) else m.get("ts")
        # Backfill: if old messages have thinking inside content, split it now.
        if m.get("role") == "agent" and "<think>" in (m.get("content") or ""):
            split = _split_thinking(m["content"])
            m["thinking"] = split["thinking"]
            m["content"] = split["answer"]
    return jsonify(conv)


# ponytail: gate uploads behind auth + ownership. The previous version was
# world-readable by anyone who guessed a UUID. We now only serve files that
# participate in a conversation the caller is part of, or that belong to a
# case assigned to the caller. Anything else returns 403.
@app.get("/uploads/<path:fname>")
def uploads(fname):
    u, err = require_auth(request)
    if err:
        return err
    # safe-name: uuid-only, no traversal
    safe = fname.split("/")[-1]
    if not safe or "/" in fname or ".." in fname:
        return jsonify({"error": "bad_path"}), 400
    file_path = UPLOAD_DIR / safe
    if not file_path.exists():
        return jsonify({"error": "not_found"}), 404

    if u["role"] == "admin":
        return send_from_directory(UPLOAD_DIR, safe)

    # ponytail: first check the upload registry — the uploader can always
    # preview their own upload before the message that references it has been
    # POSTed to /chat. Falls through to chat-ownership check after.
    own = dbm.upload_registry().find_one({"file_id": safe, "uploader_id": u["_id"]})
    if own:
        return send_from_directory(UPLOAD_DIR, safe)

    # Patient: must own a conversation that references this file.
    if u["role"] == "patient":
        owns = dbm.chats().find_one({"patient_id": u["_id"], "messages.image_url": f"/uploads/{safe}"})
        if owns:
            return send_from_directory(UPLOAD_DIR, safe)
        return jsonify({"error": "forbidden"}), 403

    # Doctor: must have a case that references this file, or a chat assigned to them.
    if u["role"] == "doctor":
        case = dbm.chats().find_one({"doctor_id": u["_id"], "messages.image_url": f"/uploads/{safe}"})
        if case:
            return send_from_directory(UPLOAD_DIR, safe)
        return jsonify({"error": "forbidden"}), 403

    return jsonify({"error": "forbidden"}), 403


# ------------ doctors + appointments ------------
from .services import doctors as doctor_svc  # noqa: E402
from .services import curator as curator_svc  # noqa: E402
from .services import cases as case_svc  # noqa: E402
from .services import match as match_svc  # noqa: E402

@app.get("/api/doctors")
def doctors_list():
    u, err = require_auth(request)
    if err:
        return err
    out = doctor_svc.list_doctors(
        specialty=request.args.get("specialty", ""),
        city=request.args.get("city", ""),
        q=request.args.get("q", ""),
    )
    return jsonify(out)


@app.get("/api/doctors/<doctor_id>")
def doctors_get(doctor_id):
    u, err = require_auth(request)
    if err:
        return err
    d = doctor_svc.get_doctor(doctor_id)
    if not d:
        return jsonify({"error": "not_found"}), 404
    return jsonify(d)


@app.post("/api/appointments")
def appointments_create():
    u, err = require_auth(request)
    if err:
        return err
    body = request.get_json(force=True, silent=True) or {}
    doctor_id = body.get("doctor_id")
    if not doctor_id:
        return jsonify({"error": "doctor_id_required"}), 400
    try:
        scheduled_at = datetime.fromisoformat(body["scheduled_at"].replace("Z", "+00:00"))
    except (KeyError, ValueError):
        return jsonify({"error": "invalid_scheduled_at",
                        "detail": "ISO-8601 required"}), 400
    # ponytail: refuse past appointments and constrain duration. Without this,
    # a malicious caller could schedule "duration_min=10**18" and DoS the
    # doctor's calendar UI.
    if scheduled_at < datetime.now(timezone.utc) - timedelta(minutes=5):
        return jsonify({"error": "scheduled_at_in_past"}), 400
    try:
        duration = int(body.get("duration_min") or 30)
    except (TypeError, ValueError):
        return jsonify({"error": "invalid_duration"}), 400
    if not (5 <= duration <= 240):
        return jsonify({"error": "invalid_duration", "detail": "5-240 min"}), 400
    notes = (body.get("notes") or "").strip()
    if len(notes) > 2000:
        return jsonify({"error": "notes_too_long"}), 400
    out = doctor_svc.create_appointment(u["_id"], doctor_id, scheduled_at, duration, notes)
    audit.write("appointment.created", actor_id=u["_id"], request=request,
                target={"type": "appointment", "id": out["id"]},
                detail={"doctor_id": doctor_id})
    return jsonify(out), 201


@app.get("/api/appointments")
def appointments_list():
    u, err = require_auth(request)
    if err:
        return err
    role = request.args.get("role") or u["role"]
    if role not in {"patient", "doctor"} or (role != u["role"] and u["role"] != "admin"):
        return jsonify({"error": "forbidden"}), 403
    out = doctor_svc.list_appointments(u["_id"], role, request.args.get("status", ""))
    return jsonify(out)


@app.patch("/api/appointments/<appointment_id>")
def appointments_patch(appointment_id):
    u, err = require_auth(request, role="doctor")
    if err:
        return err
    body = request.get_json(force=True, silent=True) or {}
    ok, code = doctor_svc.update_appointment(appointment_id, u["_id"], body)
    if not ok:
        # ponytail: surface the reason instead of always returning 404.
        status = 404 if code == "not_found" else 400
        return jsonify({"error": code}), status
    audit.write("appointment.updated", actor_id=u["_id"], request=request,
                target={"type": "appointment", "id": appointment_id},
                detail={"patch": list(body.keys())})
    return jsonify({"ok": True})


# ------------ curator (doctor) ------------
@app.get("/api/curator/today")
def curator_today():
    u, err = require_auth(request, role="doctor")
    if err:
        return err
    return jsonify(curator_svc.get_today(config, u["_id"], u.get("specialty", "general medicine")))


@app.post("/api/curator/refresh")
def curator_refresh():
    u, err = require_auth(request, role="doctor")
    if err:
        return err
    return jsonify(curator_svc.refresh(config, u["_id"], u.get("specialty", "general medicine")))


@app.get("/api/curator/history")
def curator_history():
    u, err = require_auth(request, role="doctor")
    if err:
        return err
    return jsonify(curator_svc.history(u["_id"],
                                        request.args.get("from"), request.args.get("to")))


@app.post("/api/curator/save")
def curator_save():
    u, err = require_auth(request, role="doctor")
    if err:
        return err
    body = request.get_json(force=True, silent=True) or {}
    digest_id = body.get("digest_id")
    topic_idx = body.get("topic_idx")
    if not digest_id or topic_idx is None:
        return jsonify({"error": "digest_id_and_topic_idx_required"}), 400
    if not curator_svc.save_topic(u["_id"], digest_id, int(topic_idx)):
        return jsonify({"error": "not_found"}), 404
    audit.write("curator.saved", actor_id=u["_id"], request=request,
                target={"type": "digest", "id": digest_id},
                detail={"topic_idx": topic_idx})
    return jsonify({"ok": True}), 201


@app.get("/api/reading-list")
def reading_list():
    u, err = require_auth(request, role="doctor")
    if err:
        return err
    return jsonify(curator_svc.reading_list(u["_id"]))


@app.post("/api/doctors/match")
def doctors_match():
    u, err = require_auth(request)
    if err:
        return err
    body = request.get_json(force=True, silent=True) or {}
    text = (body.get("symptoms_text") or body.get("query") or "").strip()
    city = (body.get("city") or "").strip()
    if not text:
        return jsonify({"error": "symptoms_text_required"}), 400
    out = match_svc.match(text, city=city, limit=int(body.get("limit") or 5))
    audit.write("match.requested", actor_id=u["_id"], request=request,
                target={"type": "match"}, detail={"specialty": out["specialty"]})
    return jsonify(out)


# ------------ doctor: case queue + case detail ------------
@app.get("/api/cases")
def cases_list():
    u, err = require_auth(request, role="doctor")
    if err:
        return err
    return jsonify(case_svc.patient_queue(u["_id"], request.args.get("status", "")))


@app.get("/api/cases/unassigned")
def cases_unassigned():
    u, err = require_auth(request, role="doctor")
    if err:
        return err
    return jsonify(case_svc.unassigned_queue(u["_id"]))


@app.post("/api/cases/<conv_id>/claim")
def case_claim(conv_id):
    u, err = require_auth(request, role="doctor")
    if err:
        return err
    # ponytail: only verified, active doctors can claim. A suspended doctor
    # session (token still valid in window) is blocked here, matching the
    # other write paths.
    if u.get("status") != "active":
        return jsonify({"error": "doctor_not_active"}), 403
    doc = dbm.doctors().find_one({"_id": u["_id"]})
    if not doc or not doc.get("verified_at"):
        return jsonify({"error": "doctor_not_verified"}), 403
    if not case_svc.assign_doctor(conv_id, u["_id"]):
        return jsonify({"error": "already_claimed"}), 409
    audit.write("case.claimed", actor_id=u["_id"], request=request,
                target={"type": "case", "id": conv_id})
    return jsonify({"ok": True})


@app.get("/api/cases/<conv_id>")
def case_detail(conv_id):
    u, err = require_auth(request, role="doctor")
    if err:
        return err
    c = case_svc.get_case(conv_id, u["_id"])
    if not c:
        return jsonify({"error": "not_found"}), 404
    profile = case_svc.patient_profile(c["patient_id"])
    c["patient"] = profile
    return jsonify(c)


@app.post("/api/cases/<conv_id>/note")
def case_note(conv_id):
    u, err = require_auth(request, role="doctor")
    if err:
        return err
    body = request.get_json(force=True, silent=True) or {}
    note = (body.get("note") or "").strip()
    if not note:
        return jsonify({"error": "note_required"}), 400
    if not case_svc.add_doctor_note(conv_id, u["_id"], note):
        return jsonify({"error": "not_found"}), 404
    audit.write("case.note_added", actor_id=u["_id"], request=request,
                target={"type": "case", "id": conv_id},
                detail={"len": len(note)})
    return jsonify({"ok": True})


@app.post("/api/cases/<conv_id>/close")
def case_close(conv_id):
    u, err = require_auth(request, role="doctor")
    if err:
        return err
    if not case_svc.close_case(conv_id, u["_id"]):
        return jsonify({"error": "not_found"}), 404
    audit.write("case.closed", actor_id=u["_id"], request=request,
                target={"type": "case", "id": conv_id})
    return jsonify({"ok": True})


# ------------ admin ------------
@app.get("/api/admin/doctors/pending")
def admin_pending_doctors():
    u, err = require_auth(request, role="admin")
    if err:
        return err
    out = []
    for d in dbm.users().find({"role": "doctor", "status": "pending_verification"}).limit(200):
        out.append({"id": d["_id"], "name": d["name"], "email": d["email"],
                    "specialty": d.get("specialty", ""),
                    "license_no": d.get("license_no", "")})
    return jsonify(out)


@app.post("/api/admin/doctors/<doctor_id>/verify")
def admin_verify_doctor(doctor_id):
    admin, err = require_auth(request, role="admin")
    if err:
        return err
    body = request.get_json(force=True, silent=True) or {}
    decision = body.get("decision")
    reason = body.get("reason", "")
    if decision not in {"approve", "reject"}:
        return jsonify({"error": "invalid_decision"}), 400
    new_status = "active" if decision == "approve" else "rejected"
    r = dbm.users().update_one({"_id": doctor_id, "role": "doctor"},
                               {"$set": {"status": new_status}})
    if r.matched_count == 0:
        return jsonify({"error": "not_found"}), 404
    if decision == "approve":
        dbm.doctors().update_one({"_id": doctor_id},
                                 {"$set": {"verified_at": datetime.now(timezone.utc),
                                           "verified_by": admin["_id"]}})
    audit.write(f"doctor.{decision}d", actor_id=admin["_id"], request=request,
                target={"type": "doctor", "id": doctor_id},
                detail={"reason": reason})
    return jsonify({"ok": True, "status": new_status})


@app.get("/api/admin/users")
def admin_users():
    admin, err = require_auth(request, role="admin")
    if err:
        return err
    flt = {}
    if request.args.get("role"):
        flt["role"] = request.args["role"]
    if request.args.get("status"):
        flt["status"] = request.args["status"]
    q = request.args.get("q", "").strip()
    out = []
    for u in dbm.users().find(flt).sort("created_at", -1).limit(200):
        if q and q.lower() not in u["email"].lower() and q.lower() not in u["name"].lower():
            continue
        out.append({"id": u["_id"], "email": u["email"], "name": u["name"],
                    "role": u["role"], "status": u.get("status"),
                    "created_at": u["created_at"].isoformat()})
    return jsonify(out)


@app.post("/api/admin/users/<user_id>/suspend")
def admin_suspend(user_id):
    admin, err = require_auth(request, role="admin")
    if err:
        return err
    body = request.get_json(force=True, silent=True) or {}
    reason = body.get("reason", "")
    r = dbm.users().update_one({"_id": user_id}, {"$set": {"status": "suspended"}})
    if r.matched_count == 0:
        return jsonify({"error": "not_found"}), 404
    audit.write("user.suspended", actor_id=admin["_id"], request=request,
                target={"type": "user", "id": user_id}, detail={"reason": reason})
    return jsonify({"ok": True})


@app.get("/api/admin/audit")
def admin_audit():
    admin, err = require_auth(request, role="admin")
    if err:
        return err
    flt = {}
    if request.args.get("actor"):
        flt["actor_id"] = request.args["actor"]
    if request.args.get("action"):
        flt["action"] = request.args["action"]
    if request.args.get("from") or request.args.get("to"):
        rng = {}
        for k, qk in (("from", "$gte"), ("to", "$lt")):
            try:
                rng[qk] = datetime.fromisoformat(request.args[k].replace("Z", "+00:00"))
            except (KeyError, ValueError):
                pass
        if rng:
            flt["ts"] = rng
    out = []
    for e in dbm.audit_log().find(flt).sort("ts", -1).limit(200):
        out.append({"id": e["_id"], "actor_id": e.get("actor_id"),
                    "action": e["action"],
                    "target": e.get("target", {}),
                    "ip": e.get("ip"),
                    "ts": e["ts"].isoformat(),
                    "detail": e.get("detail", {})})
    return jsonify(out)


@app.get("/api/admin/stats")
def admin_stats():
    admin, err = require_auth(request, role="admin")
    if err:
        return err
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    return jsonify({
        "users": dbm.users().count_documents({}),
        "patients": dbm.users().count_documents({"role": "patient"}),
        "doctors": dbm.users().count_documents({"role": "doctor"}),
        "doctors_pending": dbm.users().count_documents({"role": "doctor",
                                                       "status": "pending_verification"}),
        "chats_today": dbm.chats().count_documents({"updated_at": {"$gte": today_start}}),
    })


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", "5050"))
    app.run(host="0.0.0.0", port=port, debug=False)
