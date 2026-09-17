"""Mongo client + index bootstrap. Single source of truth for the DB."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27018")
DB_NAME = os.getenv("MONGO_DB", "medassist")

_client: MongoClient | None = None


def client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client


def db() -> Database:
    return client()[DB_NAME]


def users() -> Collection:
    return db()["users"]


def doctors() -> Collection:
    return db()["doctors"]


def patients() -> Collection:
    return db()["patients"]


def chats() -> Collection:
    return db()["chats"]


def appointments() -> Collection:
    return db()["appointments"]


def curator_digests() -> Collection:
    return db()["curator_digests"]


def reading_list() -> Collection:
    return db()["reading_list"]


def audit_log() -> Collection:
    return db()["audit_log"]


def refresh_sessions() -> Collection:
    return db()["sessions"]


def password_resets() -> Collection:
    return db()["password_resets"]


def email_verifications() -> Collection:
    return db()["email_verifications"]


# ponytail: ensure_indexes is idempotent. Called once on app startup. Adding an
# index for a new field = add the line here; do not sprinkle create_index()
# calls through route handlers.
def ensure_indexes() -> None:
    users().create_index([("email", ASCENDING)], unique=True)
    users().create_index([("role", ASCENDING), ("status", ASCENDING)])
    doctors().create_index([("specialty", ASCENDING), ("city", ASCENDING)])
    chats().create_index([("patient_id", ASCENDING), ("updated_at", DESCENDING)])
    chats().create_index([("doctor_id", ASCENDING), ("status", ASCENDING)])
    appointments().create_index([("patient_id", ASCENDING), ("scheduled_at", DESCENDING)])
    appointments().create_index([("doctor_id", ASCENDING), ("scheduled_at", ASCENDING)])
    curator_digests().create_index([("doctor_id", ASCENDING), ("date", ASCENDING)], unique=True)
    reading_list().create_index([("doctor_id", ASCENDING), ("saved_at", DESCENDING)])
    audit_log().create_index([("ts", DESCENDING)])
    audit_log().create_index([("actor_id", ASCENDING), ("ts", DESCENDING)])
    refresh_sessions().create_index([("refresh_token_hash", ASCENDING)],
                                    unique=True, partialFilterExpression={"refresh_token_hash": {"$exists": True}})
    refresh_sessions().create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)
    password_resets().create_index([("token_hash", ASCENDING)], unique=True)
    password_resets().create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)
    email_verifications().create_index([("token_hash", ASCENDING)], unique=True)
    email_verifications().create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)
