"""
Agent Session Token router — Phase 10.

Endpoints:
  POST   /tokens/agent         — generate a new 8h agent session token
  GET    /tokens/agent         — list current user's active tokens
  DELETE /tokens/agent/{jti}   — revoke a specific token
"""
import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import AgentSessionDB, UserDB
from app.db.session import SessionLocal
from app.middleware.auth import get_current_user
from app.services.auth import create_agent_session_token, resolve_permissions

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tokens", tags=["agent-tokens"])


def _get_db():
    with SessionLocal() as db:
        yield db


@router.post("/agent")
async def generate_agent_token(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(_get_db),
):
    """
    Generates a signed 8-hour agent session token for the current user.
    Permissions are baked in from the current role + any admin overrides.
    Store this token as SENTINEL_TOKEN env var in your agent.
    """
    # Resolve permissions at issue time (snapshot)
    overrides = [(p.action, p.allowed) for p in current_user.permissions]
    permissions = resolve_permissions(current_user.role, overrides)

    session_id = str(uuid.uuid4())
    token, jti, expires_at = create_agent_session_token(
        user_id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        permissions=permissions,
        session_id=session_id,
    )

    # Persist to DB for revocation tracking
    session_row = AgentSessionDB(
        session_id=session_id,
        user_id=current_user.id,
        jti=jti,
        role_at_issue=current_user.role,
        permissions_json=json.dumps(permissions),
        issued_at=datetime.now(timezone.utc),
        expires_at=expires_at,
        is_revoked=False,
    )
    db.add(session_row)
    db.commit()

    logger.info("Agent token issued for %s (role=%s, jti=%s)", current_user.email, current_user.role, jti)

    return {
        "token": token,
        "jti": jti,
        "session_id": session_id,
        "role": current_user.role,
        "permissions": permissions,
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat(),
        "usage": {
            "header": "X-Sentinel-Token",
            "example": f"curl -H 'X-Sentinel-Token: {token[:30]}...' http://localhost:8000/screen",
            "env_var": "export SENTINEL_TOKEN=<token>",
        },
    }


@router.get("/agent")
async def list_agent_tokens(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(_get_db),
):
    """List all agent session tokens for the current user (active and revoked)."""
    sessions = (
        db.query(AgentSessionDB)
        .filter(AgentSessionDB.user_id == current_user.id)
        .order_by(AgentSessionDB.issued_at.desc())
        .limit(20)
        .all()
    )

    return {
        "tokens": [
            {
                "jti": s.jti,
                "session_id": s.session_id,
                "role_at_issue": s.role_at_issue,
                "permissions": json.loads(s.permissions_json),
                "issued_at": s.issued_at.isoformat(),
                "expires_at": s.expires_at.isoformat(),
                "is_revoked": s.is_revoked,
                "is_expired": (
                    s.expires_at < datetime.now(timezone.utc)
                    if s.expires_at.tzinfo is not None
                    else s.expires_at < datetime.now(timezone.utc).replace(tzinfo=None)
                ),
            }
            for s in sessions
        ],
        "total": len(sessions),
    }


@router.delete("/agent/{jti}")
async def revoke_agent_token(
    jti: str,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(_get_db),
):
    """
    Immediately revokes an agent session token by JTI.
    Subsequent /screen calls with this token will receive 401.
    """
    session_row = db.query(AgentSessionDB).filter(
        AgentSessionDB.jti == jti,
        AgentSessionDB.user_id == current_user.id,  # users can only revoke their own tokens
    ).first()

    if not session_row:
        raise HTTPException(status_code=404, detail="Token not found or does not belong to you.")

    if session_row.is_revoked:
        return {"status": "already_revoked", "jti": jti}

    session_row.is_revoked = True
    db.commit()

    logger.info("Token revoked by %s: jti=%s", current_user.email, jti)
    return {"status": "revoked", "jti": jti, "message": "Token immediately invalidated."}
