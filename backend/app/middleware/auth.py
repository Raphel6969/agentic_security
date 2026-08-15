"""
FastAPI auth dependencies for Sentinel Layer Phase 10.

Provides:
  get_current_user  — validates Bearer JWT, returns UserDB
  require_role      — role-gate factory
  read_agent_token  — reads X-Sentinel-Token, returns decoded payload or None
"""
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.db.models import AgentSessionDB, UserDB
from app.db.session import SessionLocal
from app.services.auth import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def _get_db():
    with SessionLocal() as db:
        yield db


# ── Dashboard JWT auth ─────────────────────────────────────────────────────────

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(_get_db),
) -> UserDB:
    """
    FastAPI dependency. Validates Bearer JWT and returns the active UserDB row.
    Raises 401 on invalid/missing token.
    """
    _credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials:
        raise _credentials_exception

    try:
        payload = decode_token(credentials.credentials)
        user_id: str = payload.get("sub", "")
        token_type: str = payload.get("type", "")
        if not user_id or token_type != "dashboard":
            raise _credentials_exception
    except JWTError:
        raise _credentials_exception

    user = db.query(UserDB).filter(UserDB.id == user_id, UserDB.is_active == True).first()
    if not user:
        raise _credentials_exception

    return user


def require_role(*allowed_roles: str):
    """
    Dependency factory for role-gated routes.
    Usage: Depends(require_role("admin")) or Depends(require_role("admin", "tech_lead"))
    """
    async def _check(current_user: UserDB = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(allowed_roles)}. Your role: {current_user.role}",
            )
        return current_user
    return _check


# ── Agent session token ────────────────────────────────────────────────────────

async def read_agent_token(
    x_sentinel_token: Optional[str] = Header(default=None, alias="X-Sentinel-Token"),
    db: Session = Depends(_get_db),
) -> Optional[dict]:
    """
    Reads the X-Sentinel-Token header for /screen calls.
    Returns decoded payload dict if valid and not revoked, else None.
    Raises 401 only on tampered/expired tokens (not on missing token — backward-compatible).
    """
    if not x_sentinel_token:
        return None  # No token — backward compatible, cascade runs normally

    try:
        from app.services.auth import decode_agent_token
        payload = decode_agent_token(x_sentinel_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Agent session token is invalid or expired.")
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    # Revocation check
    jti = payload.get("jti")
    if jti:
        session_row = db.query(AgentSessionDB).filter(AgentSessionDB.jti == jti).first()
        if session_row and session_row.is_revoked:
            raise HTTPException(status_code=401, detail="Agent session token has been revoked.")

    return payload
