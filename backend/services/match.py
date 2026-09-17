"""Patient -> doctor matching.

Uses agents.specialty_extractor to get a specialty from the symptoms text,
then ranks verified doctors by specialty match + rating + cases_count.
Returns the top N with human-readable reasons.

Note: a single LLM call (extractor) + at most two Mongo finds. ~300ms typical.
"""
from __future__ import annotations

from typing import Optional

from .. import db as dbm
from agents.specialty_extractor import extract as extract_specialty


def match(symptoms_text: str, city: str = "", limit: int = 5) -> dict:
    # ponytail: clamp limit. A request for limit=10000 would otherwise pull
    # the entire collection.
    limit = max(1, min(int(limit or 5), 20))

    info = extract_specialty(symptoms_text)
    spec = info["specialty"]

    # ponytail: filter to verified doctors only. Unverified doctors must not
    # appear in patient-facing matches, even as fallbacks.
    verified_filter = {"verified_at": {"$ne": None}}

    flt = dict(verified_filter)
    if spec != "general":
        flt["specialty"] = spec
    if city:
        flt["city"] = city

    doctors = []
    if flt != verified_filter:
        for d in dbm.doctors().find(flt).sort([("rating", -1), ("cases_count", -1)]).limit(limit):
            doctors.append(_shape(d, score=10, reason=f"specialty matches ({spec})"))

    if len(doctors) < limit:
        extra_n = limit - len(doctors)
        seen_ids = [d["id"] for d in doctors]
        fallback_flt = dict(verified_filter)
        if city:
            fallback_flt["city"] = city
        if seen_ids:
            fallback_flt["_id"] = {"$nin": seen_ids}
        for d in dbm.doctors().find(fallback_flt).sort("rating", -1).limit(extra_n):
            doctors.append(_shape(d, score=2, reason="general coverage"))

    return {
        "specialty": spec,
        "urgency": info["urgency"],
        "red_flags": info["red_flags"],
        "doctors": doctors[:limit],
    }


def _shape(d: dict, score: float, reason: str) -> dict:
    return {
        "id": d["_id"],
        "name": d.get("name", ""),
        "specialty": d.get("specialty", ""),
        "city": d.get("city", ""),
        "rating": d.get("rating", 0.0),
        "cases_count": d.get("cases_count", 0),
        "bio": d.get("bio", ""),
        "score": score,
        "reasons": [reason],
    }
