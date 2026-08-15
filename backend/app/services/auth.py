"""
JWT creation, decoding, and permission resolution for Sentinel Layer Phase 10.
"""
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()

# ── Role default permissions ──────────────────────────────────────────────────

ROLE_DEFAULTS: dict[str, dict[str, bool]] = {
    "admin":     {"search_web": True,  "read_email": True,  "execute_sql": True,  "write_file": True,  "call_http": True},
    "tech_lead": {"search_web": True,  "read_email": True,  "execute_sql": True,  "write_file": True,  "call_http": True},
    "developer": {"search_web": True,  "read_email": True,  "execute_sql": True,  "write_file": True,  "call_http": True},
    "intern":    {"search_web": True,  "read_email": True,  "execute_sql": False, "write_file": False, "call_http": False},
}

ALL_ACTIONS = list(ROLE_DEFAULTS["admin"].keys())


def get_role_permissions(role: str) -> dict[str, bool]:
    """Returns the default permission set for a role."""
    return dict(ROLE_DEFAULTS.get(role, ROLE_DEFAULTS["intern"]))


def resolve_permissions(role: str, overrides: list[tuple[str, bool]]) -> dict[str, bool]:
    """
    Merges role defaults with per-user overrides from DB.
    Admin override wins over role default.
    """
    perms = get_role_permissions(role)
    for action, allowed in overrides:
        perms[action] = allowed
    return perms


# ── Dashboard JWT (short-lived, for UI sessions) ──────────────────────────────

def create_access_token(user_id: str, email: str, role: str) -> str:
    """Creates a short-lived dashboard login JWT (60 min by default)."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "dashboard",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


# ── Agent Session JWT (8h, carries permission snapshot) ───────────────────────

def create_agent_session_token(
    user_id: str,
    email: str,
    role: str,
    permissions: dict[str, bool],
    session_id: str | None = None,
) -> tuple[str, str, datetime]:
    """
    Creates an 8h agent session JWT with permissions baked in.
    Returns (token, jti, expires_at).
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(hours=settings.jwt_agent_token_expire_hours)
    jti = str(uuid.uuid4())
    sid = session_id or str(uuid.uuid4())

    payload: dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "role": role,
        "permissions": permissions,
        "session_id": sid,
        "jti": jti,
        "type": "agent_session",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, jti, expire


# ── Token decoding ────────────────────────────────────────────────────────────

def decode_token(token: str) -> dict[str, Any]:
    """
    Decodes and validates a JWT (signature + expiry).
    Raises jose.JWTError on failure.
    """
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def decode_agent_token(token: str) -> dict[str, Any]:
    """
    Decodes an agent session token specifically.
    Raises ValueError if wrong type.
    """
    payload = decode_token(token)
    if payload.get("type") != "agent_session":
        raise ValueError("Token is not an agent session token.")
    return payload
