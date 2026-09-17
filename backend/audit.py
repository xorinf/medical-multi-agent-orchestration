"""Audit log helper — write-only from app code."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from flask import Request

from . import db as dbm


def write(action: str, *, actor_id: Optional[str] = None, request: Optional[Request] = None,
          target: Optional[dict] = None, detail: Optional[dict] = None) -> None:
    ip = request.headers.get("X-Forwarded-For", request.remote_addr) if request else None
    user_agent = request.headers.get("User-Agent", "") if request else ""
    dbm.audit_log().insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": actor_id,
        "action": action,
        "target": target or {},
        "ip": ip,
        "user_agent": user_agent,
        "detail": detail or {},
        "ts": datetime.now(timezone.utc),
    })
