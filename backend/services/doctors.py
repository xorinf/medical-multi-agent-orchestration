"""Doctor-facing services: directory, matching, appointments."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from .. import db as dbm


def list_doctors(specialty: str = "", city: str = "", q: str = "") -> list:
    # ponytail: only return verified doctors to patient-facing queries.
    # Unverified doctors exist in the DB but are hidden from search.
    flt = {"verified_at": {"$ne": None}}
    if specialty:
        flt["specialty"] = specialty
    if city:
        flt["city"] = city
    out = []
    for d in dbm.doctors().find(flt).limit(200):
        out.append({
            "id": d["_id"], "name": d.get("name", ""), "specialty": d.get("specialty", ""),
            "city": d.get("city", ""), "rating": d.get("rating", 0.0),
            "cases_count": d.get("cases_count", 0), "bio": d.get("bio", ""),
            "verified": d.get("verified_at") is not None,
            # ponytail: optional enrichment fields — empty for manually-
            # created docs, populated by the Google Places seed script.
            "phone": d.get("phone", ""),
            "address": d.get("address", ""),
        })
    if q:
        ql = q.lower()
        out = [d for d in out if ql in d["name"].lower() or ql in d["bio"].lower()]
    return out


def get_doctor(doctor_id: str) -> Optional[dict]:
    d = dbm.doctors().find_one({"_id": doctor_id})
    if not d:
        return None
    return {
        "id": d["_id"], "name": d.get("name", ""), "specialty": d.get("specialty", ""),
        "city": d.get("city", ""), "rating": d.get("rating", 0.0),
        "cases_count": d.get("cases_count", 0), "bio": d.get("bio", ""),
        "verified": d.get("verified_at") is not None,
        "availability": d.get("availability", []),
        "phone": d.get("phone", ""),
        "address": d.get("address", ""),
        "lat": d.get("lat"),
        "lng": d.get("lng"),
        "source": d.get("source", "manual"),
    }


def create_appointment(patient_id: str, doctor_id: str, scheduled_at: datetime,
                       duration_min: int, notes: str = "") -> dict:
    aid = str(__import__("uuid").uuid4())
    doc = {
        "_id": aid, "patient_id": patient_id, "doctor_id": doctor_id,
        "scheduled_at": scheduled_at, "duration_min": duration_min or 30,
        "notes_from_patient": notes, "notes_from_doctor": "",
        "status": "pending", "created_at": datetime.now(timezone.utc),
    }
    dbm.appointments().insert_one(doc)
    return {"id": aid, "status": doc["status"]}


def list_appointments(user_id: str, role: str, status: str = "") -> list:
    flt = {"patient_id" if role == "patient" else "doctor_id": user_id}
    if status:
        flt["status"] = status
    out = []
    for a in dbm.appointments().find(flt).sort("scheduled_at", -1).limit(100):
        # ponytail: hydrate the other party's display name + specialty so
        # the appointment list isn't a wall of UUIDs. One Mongo lookup per
        # appointment — fine at this scale; if volume grows, batch by
        # collecting all patient_ids/doctor_ids first.
        other_id = a["doctor_id"] if role == "patient" else a["patient_id"]
        other = dbm.users().find_one({"_id": other_id},
                                    {"name": 1, "specialty": 1, "role": 1}) or {}
        out.append({
            "id": a["_id"], "patient_id": a["patient_id"], "doctor_id": a["doctor_id"],
            "scheduled_at": a["scheduled_at"].isoformat(),
            "duration_min": a.get("duration_min", 30),
            "notes_from_patient": a.get("notes_from_patient", ""),
            "notes_from_doctor": a.get("notes_from_doctor", ""),
            "status": a["status"],
            "other_name": other.get("name", ""),
            "other_specialty": other.get("specialty", ""),
            "other_role": other.get("role", ""),
        })
    return out


# ponytail: whitelist both the keys and the allowed status values. A doctor
# can: pending→confirmed, *→cancelled, *→completed. Otherwise 400. Notes
# are free-form but capped at 2000 chars server-side too.
ALLOWED_STATUS = {"pending", "confirmed", "completed", "cancelled"}
ALLOWED_TRANSITIONS = {
    "pending":   {"confirmed", "cancelled"},
    "confirmed": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}


def _scheduled_in_future(appointment: dict) -> bool:
    """True if scheduled_at is at least 1 minute in the future.

    ponytail: tiny skew tolerance keeps the route usable across clock drift
    between client and server. The same guard is reused by the patient
    cancel route, so the rule lives in one place.
    """
    sched = appointment.get("scheduled_at")
    if not isinstance(sched, datetime):
        try:
            sched = datetime.fromisoformat(sched)
        except (TypeError, ValueError):
            return False
    if sched.tzinfo is None:
        sched = sched.replace(tzinfo=timezone.utc)
    return sched > datetime.now(timezone.utc) + timedelta(minutes=1)


def update_appointment(appointment_id: str, doctor_id: str, patch: dict) -> tuple[bool, str]:
    """Returns (success, error_code). error_code is '' on success."""
    allowed_keys = {"status", "notes_from_doctor"}
    safe = {k: v for k, v in patch.items() if k in allowed_keys}
    if not safe:
        return False, "no_fields"

    # If status is being changed, validate the transition against current state.
    if "status" in safe:
        new_status = safe["status"]
        if new_status not in ALLOWED_STATUS:
            return False, "bad_status_value"
        current = dbm.appointments().find_one(
            {"_id": appointment_id, "doctor_id": doctor_id},
            {"status": 1, "scheduled_at": 1},
        )
        if not current:
            return False, "not_found"
        if new_status not in ALLOWED_TRANSITIONS.get(current.get("status"), set()):
            return False, "bad_transition"
        # ponytail: cannot cancel a past appointment — both doctor and
        # patient cancel paths share this rule.
        if new_status == "cancelled" and not _scheduled_in_future(current):
            return False, "past_appointment"
    if "notes_from_doctor" in safe and len(safe["notes_from_doctor"]) > 2000:
        return False, "notes_too_long"

    r = dbm.appointments().update_one({"_id": appointment_id, "doctor_id": doctor_id}, {"$set": safe})
    return r.matched_count > 0, ""


def cancel_appointment_as_patient(appointment_id: str, patient_id: str) -> tuple[bool, str]:
    """Patient-initiated cancellation. Same past-date guard as the doctor
    path, but does not allow notes changes."""
    appt = dbm.appointments().find_one(
        {"_id": appointment_id, "patient_id": patient_id},
        {"status": 1, "scheduled_at": 1})
    if not appt:
        return False, "not_found"
    if appt.get("status") not in {"pending", "confirmed"}:
        return False, "bad_transition"
    if not _scheduled_in_future(appt):
        return False, "past_appointment"
    r = dbm.appointments().update_one(
        {"_id": appointment_id, "patient_id": patient_id},
        {"$set": {"status": "cancelled", "cancelled_by": "patient",
                  "cancelled_at": datetime.now(timezone.utc)}})
    return r.matched_count > 0, ""
