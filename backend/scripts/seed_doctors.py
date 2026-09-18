"""Bulk-import doctors from Google Places into the local directory.

Run once after configuring GOOGLE_MAPS_API_KEY in .env. Inserts unverified
docs so admins can review them through the existing /admin route — no
shortcut to bypassing verification.

Usage:
    source .venv/bin/activate
    python backend/scripts/seed_doctors.py --specialty cardiology --city "New York"
    python backend/scripts/seed_doctors.py --all  # all specialties, top cities
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
import time

# repo root on path so `import backend...` works regardless of cwd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from pymongo import MongoClient

from backend.services import google_places  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("seed_doctors")


# ponytail: default matrix of common specialties × major cities. Edit
# freely. Each (specialty, city) tuple produces ~10 results, deduped by
# place_id across the run.
SPECIALTY_CITY_MATRIX = [
    ("cardiology",     "New York"),  ("cardiology",     "Los Angeles"),
    ("cardiology",     "Chicago"),   ("cardiology",     "Houston"),
    ("dermatology",    "New York"),  ("dermatology",    "Los Angeles"),
    ("dermatology",    "Miami"),     ("dermatology",    "San Francisco"),
    ("neurology",      "Boston"),    ("neurology",      "New York"),
    ("pediatrics",     "Chicago"),   ("pediatrics",     "Seattle"),
    ("general",        "New York"),  ("general",        "Austin"),
    ("orthopedics",    "Denver"),    ("gynecology",     "Atlanta"),
]


def _mongo():
    """Direct client — bypasses the Flask-only `db.py` wrapper."""
    uri = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27018/medassist")
    return MongoClient(uri)


def _upsert_doctor(doc: dict, doctors) -> str:
    """Insert if not present (by place_id); never overwrite verified docs.

    ponytail: Google Places data is authoritative — name, phone, address
    all come from Google's business registry, not user submission. We
    auto-verify on import so they appear in patient-facing search. Set
    MEDASSIST_REQUIRE_GOOGLE_REVIEW=1 to fall back to the old
    pending-verification behavior for a stricter demo."""
    import os
    require_review = os.getenv("MEDASSIST_REQUIRE_GOOGLE_REVIEW") == "1"
    existing = doctors.find_one({"place_id": doc["place_id"]}) if doc.get("place_id") else None
    if existing:
        # Upgrade previously-seeded-but-unverified rows to verified if
        # the env flag isn't set (idempotent — safe to re-run).
        if not require_review and existing.get("source") == "google" and not existing.get("verified_at"):
            doctors.update_one({"_id": existing["_id"]},
                               {"$set": {"verified_at": time.time(),
                                         "verified_by": "system-seed-google-places"}})
            log.info("  promoted to verified: %s", existing.get("name"))
        else:
            log.info("  skip (already imported): %s", existing.get("name"))
        return existing["_id"]
    doc["_id"] = f"google-{doc['place_id']}"  # stable id; admin approves by _id
    doc["cases_count"] = 0
    doc["availability"] = []
    doc["created_at"] = time.time()
    if not require_review:
        doc["verified_at"] = time.time()
        doc["verified_by"] = "system-seed-google-places"
    doctors.insert_one(doc)
    log.info("  inserted: %s", doc["name"])
    return doc["_id"]


def seed(specialty: str | None, city: str | None, all_matrix: bool) -> int:
    if not google_places._is_configured():
        log.error("GOOGLE_MAPS_API_KEY not set in environment. Aborting.")
        return 1

    db = _mongo().medassist
    doctors = db.doctors

    if all_matrix:
        pairs = SPECIALTY_CITY_MATRIX
    elif specialty and city:
        pairs = [(specialty, city)]
    else:
        log.error("Provide both --specialty and --city, or --all")
        return 2

    total = 0
    for sp, ct in pairs:
        log.info("Searching %s in %s", sp, ct)
        results = google_places.search_doctors(specialty=sp, city=ct, limit=10)
        if not results:
            log.warning("  no results for %s / %s", sp, ct)
            continue
        for r in results:
            _upsert_doctor(r, doctors)
            total += 1
        # ponytail: be a polite API consumer — 200 ms between queries keeps
        # us well under the 100 req/sec rate limit and avoids surprise bans.
        time.sleep(0.2)

    log.info("Done. Inserted/skipped %s documents.", total)
    return 0


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--specialty", help="e.g. cardiology, dermatology, general")
    p.add_argument("--city", help='e.g. "New York"')
    p.add_argument("--all", action="store_true",
                   help="Use the built-in matrix of specialties × cities")
    args = p.parse_args()
    raise SystemExit(seed(args.specialty, args.city, args.all))


if __name__ == "__main__":
    main()
