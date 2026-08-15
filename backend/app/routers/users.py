"""
User management router (Admin-only) — Phase 10.

Endpoints:
  GET    /users                       — list all users
  POST   /users                       — invite a new user
  GET    /users/{user_id}             — get a single user
  PATCH  /users/{user_id}/role        — change role
  PATCH  /users/{user_id}/permissions — toggle individual action permissions
  DELETE /users/{user_id}             — soft-deactivate user
"""
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.db.models import AgentSessionDB, UserDB, UserPermissionDB
from app.db.session import SessionLocal
from app.middleware.auth import get_current_user, require_role
from app.services.auth import ALL_ACTIONS, resolve_permissions

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["user-management"])


def _get_db():
    with SessionLocal() as db:
        yield db


def _serialize_user(user: UserDB) -> dict:
    overrides = [(p.action, p.allowed) for p in user.permissions]
    permissions = resolve_permissions(user.role, overrides)
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "role": user.role,
        "permissions": permissions,
        "is_active": user.is_active,
        "oauth_provider": user.oauth_provider,
        "created_by": user.created_by,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# ── Request models ────────────────────────────────────────────────────────────

class InviteUserRequest(BaseModel):
    email: str
    name: str
    role: str = "developer"


class ChangeRoleRequest(BaseModel):
    role: str


class UpdatePermissionsRequest(BaseModel):
    permissions: dict[str, bool]  # e.g. {"execute_sql": false, "write_file": true}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
async def list_users(
    admin: UserDB = Depends(require_role("admin")),
    db: Session = Depends(_get_db),
):
    """Admin only. Returns all users with roles and resolved permissions."""
    users = db.query(UserDB).order_by(UserDB.created_at.desc()).all()
    return {"users": [_serialize_user(u) for u in users], "total": len(users)}


@router.post("", status_code=status.HTTP_201_CREATED)
async def invite_user(
    request: InviteUserRequest,
    admin: UserDB = Depends(require_role("admin")),
    db: Session = Depends(_get_db),
):
    """
    Admin invites a new user. Creates an inactive account.
    User can log in via OAuth once invited — their account is then activated.
    """
    valid_roles = {"admin", "tech_lead", "developer", "intern"}
    if request.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")

    existing = db.query(UserDB).filter(UserDB.email == request.email).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"User with email {request.email} already exists.")

    user = UserDB(
        id=str(uuid.uuid4()),
        email=request.email,
        name=request.name,
        role=request.role,
        is_active=False,  # activated on first OAuth login
        created_by=admin.id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info("Admin %s invited %s as %s", admin.email, request.email, request.role)
    return {"message": f"User {request.email} invited as {request.role}.", "user": _serialize_user(user)}


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    admin: UserDB = Depends(require_role("admin")),
    db: Session = Depends(_get_db),
):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return _serialize_user(user)


@router.patch("/{user_id}/role")
async def change_role(
    user_id: str,
    request: ChangeRoleRequest,
    admin: UserDB = Depends(require_role("admin")),
    db: Session = Depends(_get_db),
):
    """Admin changes a user's role. Takes effect on next token generation."""
    valid_roles = {"admin", "tech_lead", "developer", "intern"}
    if request.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")

    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    old_role = user.role
    user.role = request.role
    db.commit()

    logger.info("Admin %s changed %s role: %s → %s", admin.email, user.email, old_role, request.role)
    return {"message": f"Role updated: {old_role} → {request.role}", "user": _serialize_user(user)}


@router.patch("/{user_id}/permissions")
async def update_permissions(
    user_id: str,
    request: UpdatePermissionsRequest,
    admin: UserDB = Depends(require_role("admin")),
    db: Session = Depends(_get_db),
):
    """
    Admin toggles specific permissions for a user.
    Changes take effect when the user next generates an agent session token.
    Only changed actions need to be provided.
    """
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    updated = {}
    for action, allowed in request.permissions.items():
        if action not in ALL_ACTIONS:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}. Valid: {ALL_ACTIONS}")

        existing = db.query(UserPermissionDB).filter(
            UserPermissionDB.user_id == user_id,
            UserPermissionDB.action == action,
        ).first()

        if existing:
            existing.allowed = allowed
        else:
            db.add(UserPermissionDB(user_id=user_id, action=action, allowed=allowed))

        updated[action] = allowed

    db.commit()
    db.refresh(user)

    logger.info("Admin %s updated permissions for %s: %s", admin.email, user.email, updated)
    return {
        "message": "Permissions updated. Changes take effect on next token generation.",
        "updated": updated,
        "user": _serialize_user(user),
    }


@router.delete("/{user_id}")
async def deactivate_user(
    user_id: str,
    admin: UserDB = Depends(require_role("admin")),
    db: Session = Depends(_get_db),
):
    """Soft-deactivates a user. Revokes all their agent session tokens."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself.")

    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_active = False
    # Revoke all active agent session tokens
    db.query(AgentSessionDB).filter(
        AgentSessionDB.user_id == user_id,
        AgentSessionDB.is_revoked == False,
    ).update({"is_revoked": True})
    db.commit()

    logger.info("Admin %s deactivated user %s", admin.email, user.email)
    return {"message": f"User {user.email} deactivated and all tokens revoked."}
