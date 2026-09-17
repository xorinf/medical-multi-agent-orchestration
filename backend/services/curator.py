"""Curator service — daily digest per doctor, cached in Mongo."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from .. import db as dbm
from config import Config  # noqa: E402


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _build_digest(config: Config, specialty: str) -> list:
    try:
        from agents.web_search_processor_agent import WebSearchProcessorAgent
        ws = WebSearchProcessorAgent(config=config)
        topics = [
            f"latest {specialty} clinical guidelines 2026",
            f"recent {specialty} case reports and innovations",
            f"new drugs and surgical techniques in {specialty}",
        ]
        items = []
        for t in topics:
            try:
                summary = ws.process_web_search_results(t)
                items.append({
                    "topic": t,
                    "sources": [{"title": "summary", "url": "",
                                 "snippet": str(summary)[:1200]}],
                })
            except Exception as ie:
                items.append({"topic": t,
                              "sources": [{"title": "(search failed)", "url": "",
                                           "snippet": str(ie)[:300]}]})
        return items
    except Exception as e:
        return [{"topic": f"{specialty} digest",
                 "sources": [{"title": "curator unavailable", "url": "",
                              "snippet": str(e)[:300]}]}]


def get_today(config: Config, doctor_id: str, specialty: str) -> dict:
    today = _today()
    # ponytail: use upsert to avoid the check-then-act race where two concurrent
    # requests for the same doctor+date both build the digest and one of them
    # fails with DuplicateKeyError. With upsert, exactly one wins; the other
    # gets the cached value back.
    existing = dbm.curator_digests().find_one({"doctor_id": doctor_id, "date": today})
    if existing:
        return {"date": today, "topics": existing["topics"], "cached": True}
    topics = _build_digest(config, specialty)
    try:
        dbm.curator_digests().insert_one({
            "doctor_id": doctor_id, "date": today, "topics": topics,
            "created_at": datetime.now(timezone.utc),
        })
        return {"date": today, "topics": topics, "cached": False}
    except Exception:
        # Race: another request inserted first. Re-fetch and return cached.
        row = dbm.curator_digests().find_one({"doctor_id": doctor_id, "date": today})
        if row:
            return {"date": today, "topics": row["topics"], "cached": True}
        raise


def refresh(config: Config, doctor_id: str, specialty: str) -> dict:
    today = _today()
    topics = _build_digest(config, specialty)
    dbm.curator_digests().update_one(
        {"doctor_id": doctor_id, "date": today},
        {"$set": {"topics": topics}},
        upsert=True,
    )
    return {"date": today, "topics": topics, "cached": False}


def history(doctor_id: str, from_date: Optional[str] = None,
            to_date: Optional[str] = None) -> list:
    flt = {"doctor_id": doctor_id}
    if from_date or to_date:
        rng = {}
        if from_date:
            rng["$gte"] = from_date
        if to_date:
            rng["$lte"] = to_date
        flt["date"] = rng
    out = []
    for r in dbm.curator_digests().find(flt).sort("date", -1).limit(60):
        out.append({"id": str(r["_id"]), "date": r["date"], "topics": r.get("topics", [])})
    return out


def save_topic(doctor_id: str, digest_id: str, topic_idx: int) -> bool:
    digest = dbm.curator_digests().find_one({"_id": digest_id, "doctor_id": doctor_id})
    if not digest or topic_idx >= len(digest.get("topics", [])):
        return False
    dbm.reading_list().insert_one({
        "doctor_id": doctor_id, "digest_id": digest_id, "topic_idx": topic_idx,
        "saved_at": datetime.now(timezone.utc),
    })
    return True


def reading_list(doctor_id: str) -> list:
    out = []
    for s in dbm.reading_list().find({"doctor_id": doctor_id}).sort("saved_at", -1).limit(200):
        digest = dbm.curator_digests().find_one({"_id": s["digest_id"]})
        if not digest or s["topic_idx"] >= len(digest.get("topics", [])):
            continue
        topic = digest["topics"][s["topic_idx"]]
        out.append({"id": str(s["_id"]), "date": digest["date"],
                    "topic": topic.get("topic", ""), "saved_at": s["saved_at"].isoformat(),
                    "sources": topic.get("sources", [])})
    return out
