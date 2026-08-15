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


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    token: Optional[str] = None,
    db: Session = Depends(_get_db),
) -> Optional[UserDB]:
    """
    Returns UserDB if valid Bearer token or ?token= query param is provided, else None.
    Does not raise 401, enabling role-filtered data scoping while maintaining public demo access.
    """
    raw_token = None
    if credentials:
        raw_token = credentials.credentials
    elif token:
        raw_token = token

    if not raw_token:
        return None

    try:
        payload = decode_token(raw_token)
        user_id: str = payload.get("sub", "")
        if not user_id:
            return None
        return db.query(UserDB).filter(UserDB.id == user_id, UserDB.is_active == True).first()
    except Exception:
        return None


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


async def read_agent_token(
    x_sentinel_token: Optional[str] = Header(default=None, alias="X-Sentinel-Token"),
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    db: Session = Depends(_get_db),
) -> Optional[dict]:
    """
    Reads agent token from either X-Sentinel-Token header or Authorization: Bearer header.
    Supports both issued Agent Session Tokens and Dashboard User Tokens for seamless Postman testing.
    Returns decoded payload dict with sub, email, role, and permissions.
    """
    raw_token = x_sentinel_token
    if not raw_token and authorization:
        if authorization.startswith("Bearer "):
            raw_token = authorization.replace("Bearer ", "", 1).strip()
        else:
            raw_token = authorization.strip()

    if not raw_token:
        return None  # No token — backward compatible, cascade runs normally

    try:
        from app.services.auth import decode_token, resolve_permissions
        payload = decode_token(raw_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token is invalid or expired.")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    token_type = payload.get("type", "")

    # If it's a dashboard token (e.g. copied from login or auth header in Postman)
    if token_type == "dashboard":
        user_id = payload.get("sub", "")
        user = db.query(UserDB).filter(UserDB.id == user_id, UserDB.is_active == True).first()
        if not user:
            raise HTTPException(status_code=401, detail="Authenticated user not found.")
        overrides = [(p.action, p.allowed) for p in user.permissions]
        perms = resolve_permissions(user.role, overrides)
        return {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "permissions": perms,
            "session_id": "dashboard_session",
            "type": "dashboard",
        }

    # If it's an agent_session token, check revocation
    if token_type == "agent_session":
        jti = payload.get("jti")
        if jti:
            session_row = db.query(AgentSessionDB).filter(AgentSessionDB.jti == jti).first()
            if session_row and session_row.is_revoked:
                raise HTTPException(status_code=401, detail="Agent session token has been revoked.")

    return payload
