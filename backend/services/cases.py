"""Doctor-side case + queue helpers."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from .. import db as dbm


def patient_queue(doctor_id: str, status: str = "") -> list:
    flt = {"doctor_id": doctor_id}
    if status:
        flt["status"] = status
    elif status is None:
        pass
    out = []
    for c in dbm.chats().find(flt).sort("updated_at", -1).limit(200):
        last = c["messages"][-1]["content"][:120] if c.get("messages") else ""
        out.append({
            "id": c["_id"], "patient_id": c["patient_id"],
            "title": last, "status": c.get("status"),
            "updated_at": c["updated_at"].isoformat(),
        })
    return out


def unassigned_queue(doctor_id: str, specialty: str = "") -> list:
    flt = {"doctor_id": None, "status": "open"}
    out = []
    for c in dbm.chats().find(flt).sort("updated_at", -1).limit(200):
        last = c["messages"][-1]["content"][:120] if c.get("messages") else ""
        out.append({
            "id": c["_id"], "patient_id": c["patient_id"],
            "title": last, "status": c.get("status"),
            "updated_at": c["updated_at"].isoformat(),
        })
    return out


def assign_doctor(conv_id: str, doctor_id: str) -> bool:
    r = dbm.chats().update_one(
        {"_id": conv_id, "doctor_id": None},
        {"$set": {"doctor_id": doctor_id, "status": "awaiting_doctor",
                  "updated_at": datetime.now(timezone.utc)}},
    )
    return r.matched_count > 0


def add_doctor_note(conv_id: str, doctor_id: str, note: str) -> bool:
    msg = {"role": "doctor", "content": note, "ts": datetime.now(timezone.utc)}
    r = dbm.chats().update_one(
        {"_id": conv_id, "doctor_id": doctor_id},
        {"$push": {"messages": msg},
         "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    return r.matched_count > 0


def close_case(conv_id: str, doctor_id: str) -> bool:
    r = dbm.chats().update_one(
        {"_id": conv_id, "doctor_id": doctor_id},
        {"$set": {"status": "closed", "updated_at": datetime.now(timezone.utc)}},
    )
    return r.matched_count > 0


def get_case(conv_id: str, doctor_id: str) -> Optional[dict]:
    c = dbm.chats().find_one({"_id": conv_id, "doctor_id": doctor_id})
    if not c:
        return None
    for k in ("created_at", "updated_at"):
        c[k] = c[k].isoformat() if isinstance(c.get(k), datetime) else c.get(k)
    for m in c.get("messages", []):
        m["ts"] = m["ts"].isoformat() if isinstance(m.get("ts"), datetime) else m.get("ts")
    return c


def patient_profile(user_id: str) -> Optional[dict]:
    p = dbm.patients().find_one({"_id": user_id})
    u = dbm.users().find_one({"_id": user_id})
    if not u:
        return None
    return {
        "id": u["_id"], "name": u["name"], "email": u["email"],
        "dob": (p or {}).get("dob"), "gender": (p or {}).get("gender"),
        "emergency_contact": (p or {}).get("emergency_contact"),
    }
