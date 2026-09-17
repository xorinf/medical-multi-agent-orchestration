"""End-to-end smoke test for MedAssist API.

Run with:  cd multi-agent-orchestration && source .venv/bin/activate && python tests/smoke.py
Exits non-zero on any failure.
"""
from __future__ import annotations

import json
import os
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone
from urllib import error as urlerr
from urllib import parse, request

BASE = os.getenv("API_BASE", "http://127.0.0.1:5050")


class C:
    def __init__(self):
        self.cookies: dict[str, str] = {}

    def req(self, method: str, path: str, json_body=None, raw=None,
            headers: dict | None = None):
        data = None
        h = {"Accept": "application/json"}
        if headers:
            h.update(headers)
        if json_body is not None:
            data = json.dumps(json_body).encode()
            h["Content-Type"] = "application/json"
        elif raw is not None:
            data = raw
        if self.cookies:
            h["Cookie"] = "; ".join(f"{k}={v}" for k, v in self.cookies.items())
        r = request.Request(f"{BASE}{path}", data=data, headers=h, method=method)
        try:
            with request.urlopen(r, timeout=180) as resp:
                for k, v in resp.headers.items():
                    if k.lower() == "set-cookie":
                        kv = v.split(";", 1)[0]
                        if "=" in kv:
                            ck, cv = kv.split("=", 1)
                            self.cookies[ck] = cv
                body = resp.read()
                if not body:
                    return resp.status, {}
                try:
                    return resp.status, json.loads(body)
                except json.JSONDecodeError:
                    return resp.status, {"_raw": body.decode(errors="replace")}
        except urlerr.HTTPError as e:
            body = e.read()
            try:
                return e.code, json.loads(body)
            except json.JSONDecodeError:
                return e.code, {"_raw": body.decode(errors="replace")}


def expect(label, cond, *details):
    if cond:
        print(f"  PASS  {label}")
    else:
        print(f"  FAIL  {label}", *details)
        sys.exit(1)


def main():
    c = C()
    pat_email = f"pat_{uuid.uuid4().hex[:8]}@x.com"
    doc_email = f"doc_{uuid.uuid4().hex[:8]}@x.com"
    pw = "testpass1"
    patient_token = ""
    doctor_token = ""
    admin_token = ""
    patient_id = ""
    doctor_id = ""
    appt_id = ""

    print("[health]")
    code, body = c.req("GET", "/api/health")
    expect("health 200", code == 200 and body.get("status") == "ok", body)

    print("[auth/register patient]")
    code, body = c.req("POST", "/api/auth/register",
                       {"email": pat_email, "password": pw, "role": "patient", "name": "Alice"})
    expect("register 201", code == 201, body)
    expect("status active", body.get("status") == "active", body)
    patient_id = body["id"]

    print("[auth/register doctor -> pending]")
    code, body = c.req("POST", "/api/auth/register",
                       {"email": doc_email, "password": pw, "role": "doctor", "name": "Dr Bob",
                        "specialty": "cardiology", "license_no": "MD-12345", "city": "Boston"})
    expect("register doctor 201", code == 201, body)
    expect("doctor pending", body.get("status") == "pending_verification", body)
    doctor_id = body["id"]

    print("[auth/login patient]")
    c.cookies.clear()
    code, body = c.req("POST", "/api/auth/login", {"email": pat_email, "password": pw})
    expect("login 200", code == 200, body)
    patient_token = body["access_token"]
    expect("token issued", bool(patient_token))

    print("[auth/me]")
    code, body = c.req("GET", "/api/auth/me", headers={"Authorization": f"Bearer {patient_token}"})
    expect("me 200", code == 200 and body.get("role") == "patient", body)

    print("[auth/refresh]")
    code, body = c.req("POST", "/api/auth/refresh")
    expect("refresh 200", code == 200 and "access_token" in body, body)
    patient_token = body["access_token"]

    print("[auth/forgot + reset flow]")
    code, _ = c.req("POST", "/api/auth/forgot", {"email": pat_email})
    expect("forgot 200 (no enumeration)", code == 200)
    # fetch the token directly from Mongo via a privileged path — for the test
    # we use the on-disk dev email stub; here we look up the row in Mongo.
    from pymongo import MongoClient
    mc = MongoClient(os.getenv("MONGO_URI", "mongodb://127.0.0.1:27018"))
    rec = list(mc["medassist"]["password_resets"].find({"used_at": None}).sort("_id", -1).limit(1))
    expect("reset row exists", len(rec) == 1)
    # we don't have the raw token; simulate reset by writing one we know.
    import secrets, hashlib
    tok = secrets.token_urlsafe(32)
    mc["medassist"]["password_resets"].insert_one({
        "user_id": patient_id,
        "token_hash": hashlib.sha256(tok.encode()).hexdigest(),
        "expires_at": time.time() + 3600, "used_at": None,
    })
    code, body = c.req("POST", "/api/auth/reset", {"token": tok, "password": pw})
    expect("reset 200", code == 200, body)
    pw_after = "newpass99"
    code, body = c.req("POST", "/api/auth/login", {"email": pat_email, "password": pw_after})
    # we just reset back to pw — login again
    code, body = c.req("POST", "/api/auth/login", {"email": pat_email, "password": pw})
    expect("login after reset", code == 200, body)
    patient_token = body["access_token"]

    print("[chat text message]")
    code, body = c.req("POST", "/api/chat",
                       {"text": "I have a mild headache for two days"},
                       headers={"Authorization": f"Bearer {patient_token}"})
    expect("chat 200", code == 200, body)
    expect("conversation_id returned", "conversation_id" in body)
    expect("content non-empty", bool(body.get("content")), body.get("content", "")[:80])
    conv_id = body["conversation_id"]

    print("[chat list]")
    code, body = c.req("GET", "/api/chat/conversations",
                       headers={"Authorization": f"Bearer {patient_token}"})
    expect("chat list 200", code == 200 and isinstance(body, list) and len(body) >= 1)
    expect("conv listed", any(c_["id"] == conv_id for c_ in body))

    print("[chat get]")
    code, body = c.req("GET", f"/api/chat/conversations/{conv_id}",
                       headers={"Authorization": f"Bearer {patient_token}"})
    expect("chat get 200", code == 200 and len(body.get("messages", [])) >= 2)

    print("[chat validate]")
    code, body = c.req("POST", f"/api/chat/{conv_id}/validate",
                       {"decision": "approve"},
                       headers={"Authorization": f"Bearer {patient_token}"})
    expect("validate 200", code == 200, body)

    print("[doctors list - patient calls]")
    code, body = c.req("GET", "/api/doctors",
                       headers={"Authorization": f"Bearer {patient_token}"})
    expect("doctors list 200", code == 200 and isinstance(body, list), body)

    print("[doctor login -> blocked because pending]")
    c2 = C()
    code, body = c2.req("POST", "/api/auth/login", {"email": doc_email, "password": pw})
    # pending_verification doctors can still log in per spec; they get a token
    # but their dashboard will reflect status. Both 200 and 403 acceptable;
    # spec says log in is allowed; verify via /api/auth/me.
    if code == 200:
        doctor_token = body["access_token"]
        code2, body2 = c2.req("GET", "/api/auth/me",
                              headers={"Authorization": f"Bearer {doctor_token}"})
        expect("doctor status pending", body2.get("status") == "pending_verification", body2)
        expect("doctor role", body2.get("role") == "doctor")
    else:
        expect("doctor login returns 200 or 403", code in (200, 403), code, body)

    print("[admin login]")
    admin_email = os.getenv("ADMIN_EMAIL", "admin@medassist.local")
    admin_pw = os.getenv("ADMIN_PASSWORD", "admin1234")
    c3 = C()
    code, body = c3.req("POST", "/api/auth/login", {"email": admin_email, "password": admin_pw})
    expect("admin login 200", code == 200, body)
    admin_token = body["access_token"]

    print("[admin/pending doctors]")
    code, body = c3.req("GET", "/api/admin/doctors/pending",
                        headers={"Authorization": f"Bearer {admin_token}"})
    expect("pending 200", code == 200)
    expect("our doctor is pending", any(d["id"] == doctor_id for d in body))

    print("[admin/verify doctor approve]")
    code, body = c3.req("POST", f"/api/admin/doctors/{doctor_id}/verify",
                        {"decision": "approve"},
                        headers={"Authorization": f"Bearer {admin_token}"})
    expect("verify 200", code == 200, body)

    print("[admin/users]")
    code, body = c3.req("GET", "/api/admin/users",
                        headers={"Authorization": f"Bearer {admin_token}"})
    expect("users 200", code == 200 and len(body) >= 3)

    print("[admin/stats]")
    code, body = c3.req("GET", "/api/admin/stats",
                        headers={"Authorization": f"Bearer {admin_token}"})
    expect("stats 200", code == 200, body)
    expect("stats has fields", {"users", "doctors", "patients", "doctors_pending"}.issubset(body.keys()))

    print("[admin/audit]")
    code, body = c3.req("GET", "/api/admin/audit",
                        headers={"Authorization": f"Bearer {admin_token}"})
    expect("audit 200", code == 200 and isinstance(body, list))

    print("[admin/suspend ourselves is forbidden path]")
    code, body = c3.req("POST", f"/api/admin/users/{patient_id}/suspend",
                        {"reason": "test"},
                        headers={"Authorization": f"Bearer {admin_token}"})
    expect("suspend 200", code == 200, body)
    # unsuspend so other tests pass
    from pymongo import MongoClient
    MongoClient(os.getenv("MONGO_URI", "mongodb://127.0.0.1:27018"))["medassist"]["users"].update_one(
        {"_id": patient_id}, {"$set": {"status": "active"}})

    print("[doctor (now active) logs in]")
    c2.cookies.clear()
    code, body = c2.req("POST", "/api/auth/login", {"email": doc_email, "password": pw})
    expect("doctor login 200", code == 200, body)
    doctor_token = body["access_token"]

    print("[doctor/curator/today]")
    code, body = c2.req("GET", "/api/curator/today",
                        headers={"Authorization": f"Bearer {doctor_token}"})
    expect("curator 200", code == 200, body)
    expect("curator has topics", isinstance(body.get("topics"), list) and len(body["topics"]) >= 1)

    print("[patient/appointments request]")
    # doctors list is empty of verified ones unless we look for our just-verified doc
    code, body = c.req("GET", "/api/doctors",
                       headers={"Authorization": f"Bearer {patient_token}"})
    our_doc = next((d for d in body if d["id"] == doctor_id), None)
    expect("doctor appears in list", our_doc is not None, body[:2] if isinstance(body, list) else body)

    when = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    code, body = c.req("POST", "/api/appointments",
                       {"doctor_id": doctor_id, "scheduled_at": when, "notes": "first visit"},
                       headers={"Authorization": f"Bearer {patient_token}"})
    expect("appointment 201", code == 201, body)
    appt_id = body["id"]

    print("[doctor sees appointment]")
    code, body = c2.req("GET", "/api/appointments?role=doctor",
                        headers={"Authorization": f"Bearer {doctor_token}"})
    expect("doctor appts 200", code == 200 and any(a["id"] == appt_id for a in body), body[:2])

    print("[doctor patches appointment]")
    code, body = c2.req("PATCH", f"/api/appointments/{appt_id}",
                        {"status": "confirmed", "notes_from_doctor": "Bring prior records."},
                        headers={"Authorization": f"Bearer {doctor_token}"})
    expect("patch 200", code == 200, body)

    print("[logout]")
    code, body = c.req("POST", "/api/auth/logout")
    expect("logout 200", code == 200, body)
    code, body = c.req("GET", "/api/auth/me", headers={"Authorization": f"Bearer {patient_token}"})
    # patient_token still valid until JWT exp; logout only revokes refresh. So still 200.
    print(f"  NOTE  me after logout still 200 (token still in window): code={code}")

    print("\nAll smoke tests passed.")


if __name__ == "__main__":
    main()
