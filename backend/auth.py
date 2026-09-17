"""Auth helpers: password hashing, JWT issue/verify, atomic refresh-session rotation."""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import time
from typing import Optional

import jwt
from flask import Request, jsonify

from . import db as dbm

JWT_ALG = "HS256"

# ponytail: refuse to start with a weak/missing secret in production. A
# hardcoded dev fallback would let attackers forge tokens across deployments.
_jwt_secret_env = os.getenv("JWT_SECRET", "")
IS_DEV = os.getenv("FLASK_ENV", "development") == "development"
if len(_jwt_secret_env) < 32:
    if IS_DEV:
        JWT_SECRET = "dev-only-DO-NOT-USE-IN-PROD-aaaaaaaaaaaaaaaaaa"  # noqa: S105
    else:
        raise RuntimeError(
            "JWT_SECRET env var must be set to a string of >=32 chars in production. "
            "Refusing to start with a known/weak signing key."
        )
else:
    JWT_SECRET = _jwt_secret_env

ACCESS_TTL = int(os.getenv("JWT_ACCESS_TTL", "900"))
REFRESH_TTL = int(os.getenv("JWT_REFRESH_TTL", "2592000"))
PBKDF2_ITERS = 120_000


def hash_pw(password: str) -> str:
    # ponytail: format "salt$iters$hash", self-describing so we can rotate.
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERS)
    return f"{salt.hex()}${PBKDF2_ITERS}${dk.hex()}"


def check_pw(password: str, stored: str) -> bool:
    try:
        salt_hex, iters, hash_hex = stored.split("$")
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iters))
        return hmac.compare_digest(dk.hex(), hash_hex)
    except (ValueError, AttributeError):
        return False


def issue_access_token(user_id: str, role: str) -> str:
    now = int(time.time())
    payload = {"sub": user_id, "role": role, "iat": now, "exp": now + ACCESS_TTL, "typ": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None


def issue_refresh_session(user_id: str, ip: str, user_agent: str) -> str:
    token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    dbm.refresh_sessions().insert_one({
        "user_id": user_id,
        "refresh_token_hash": token_hash,
        "ip": ip,
        "user_agent": user_agent,
        "created_at": time.time(),
        "expires_at": time.time() + REFRESH_TTL,
    })
    return token


# ponytail: atomic check-and-revoke via find_one_and_delete. Closes the
# concurrent-rotation race where two callers could both pass find_one on the
# same token before either issued a new one.
def rotate_refresh_session(token: str) -> Optional[dict]:
    """Atomically validate+revoke a refresh token. Returns the session doc or None."""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    now = time.time()
    return dbm.refresh_sessions().find_one_and_delete({
        "refresh_token_hash": token_hash,
        "expires_at": {"$gt": now},
    })


def _bearer(request: Request) -> Optional[str]:
    h = request.headers.get("Authorization", "")
    if h.startswith("Bearer "):
        return h[7:].strip()
    return None


def current_user(request: Request) -> Optional[dict]:
    token = _bearer(request)
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload or payload.get("typ") != "access":
        return None
    u = dbm.users().find_one({"_id": payload["sub"]})
    # ponytail: a suspended or pending-verification user with a valid token
    # should NOT be treated as authenticated.
    if u and u.get("status") not in (None, "active"):
        return None
    return u


def require_auth(request: Request, role: Optional[str] = None):
    u = current_user(request)
    if not u:
        return None, (jsonify({"error": "unauthorized"}), 401)
    if role and u.get("role") != role:
        return None, (jsonify({"error": "forbidden"}), 403)
    return u, None
