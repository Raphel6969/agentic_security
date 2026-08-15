"""
/events & /policy router for Sentinel Layer.

Provides REST & SSE endpoints for live telemetry stream, audit logs,
analytics statistics, and secure policy management.
"""
import asyncio
import json
import logging
import os
from pathlib import Path
from typing import AsyncGenerator, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import yaml

from app.config import get_settings
from app.db.models import ScreenEventDB, UserDB
from app.db.session import SessionLocal
from app.middleware.auth import get_current_user, require_role
from app.services.policy_engine import get_policy_engine

logger = logging.getLogger(__name__)
router = APIRouter(tags=["telemetry"])

# Global event queue for real-time SSE broadcasting
_event_listeners: list[asyncio.Queue] = []


def _resolve_policy_path() -> Path:
    """Accurately resolves the absolute path to policy.example.yaml."""
    settings = get_settings()
    # 1. Try settings path directly
    p = Path(settings.policy_file_path)
    if p.is_file():
        return p.resolve()

    # 2. Try relative to project root
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    root_policy = project_root / "policy" / "policy.example.yaml"
    if root_policy.is_file():
        return root_policy.resolve()

    # 3. Fallback relative to backend
    backend_policy = Path(__file__).resolve().parent.parent.parent / "policy" / "policy.example.yaml"
    if backend_policy.is_file():
        return backend_policy.resolve()

    return p


def broadcast_event(event_data: dict):
    """Utility to broadcast new screen events to all connected SSE clients."""
    for queue in _event_listeners:
        try:
            queue.put_nowait(event_data)
        except Exception:
            pass


@router.get("/events/history")
async def get_event_history(
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    verdict: str | None = None,
) -> dict:
    """Returns historical screened event logs from hot storage."""
    with SessionLocal() as db:
        query = db.query(ScreenEventDB)
        if verdict:
            query = query.filter(ScreenEventDB.verdict == verdict.lower())

        total_count = query.count()
        rows = (
            query.order_by(ScreenEventDB.timestamp.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        events = []
        for r in rows:
            signals = []
            if r.matched_signals_json:
                try:
                    signals = json.loads(r.matched_signals_json)
                except Exception:
                    signals = []

            events.append(
                {
                    "id": r.id,
                    "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                    "agent_id": r.agent_id,
                    "session_id": r.session_id,
                    "tool_name": r.tool_name,
                    "incoming_source": r.incoming_source,
                    "risk_score": r.risk_score,
                    "verdict": r.verdict,
                    "explanation": r.explanation,
                    "matched_signals": signals,
                    "policy_allowed": r.policy_allowed,
                    "policy_reason": r.policy_reason,
                    "user_id": r.user_id,
                    "user_email": r.user_email,
                    "user_role": r.user_role,
                }
            )

        return {"events": events, "total": total_count, "limit": limit, "offset": offset}


@router.get("/events/stats")
async def get_event_stats() -> dict:
    """Returns real analytics summary from hot storage."""
    with SessionLocal() as db:
        total = db.query(ScreenEventDB).count()
        blocks = db.query(ScreenEventDB).filter(ScreenEventDB.verdict == "block").count()
        allows = db.query(ScreenEventDB).filter(ScreenEventDB.verdict == "allow").count()
        approvals = db.query(ScreenEventDB).filter(ScreenEventDB.verdict == "require_approval").count()

        # Compute average risk score
        avg_score_row = db.query(ScreenEventDB.risk_score).all()
        avg_score = (
            sum(r[0] for r in avg_score_row) / len(avg_score_row) if avg_score_row else 0.0
        )

        block_rate = (blocks / total * 100) if total > 0 else 0.0

        return {
            "total_screened": total,
            "blocked": blocks,
            "allowed": allows,
            "requires_approval": approvals,
            "average_risk_score": round(avg_score, 3),
            "block_rate": round(block_rate, 1),
        }


@router.get("/events/stream")
async def sse_event_stream() -> StreamingResponse:
    """Server-Sent Events endpoint broadcasting live screening decisions."""
    async def event_generator() -> AsyncGenerator[str, None]:
        queue = asyncio.Queue()
        _event_listeners.append(queue)
        yield f"data: {json.dumps({'type': 'CONNECTED', 'message': 'Subscribed to Sentinel event stream.'})}\n\n"
        try:
            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if queue in _event_listeners:
                _event_listeners.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


class PolicyUpdateRequest(BaseModel):
    policy_yaml: str


@router.get("/policy")
async def get_policy() -> dict:
    """Returns the current policy.yaml configuration without delays."""
    policy_path = _resolve_policy_path()

    if not policy_path.exists():
        raise HTTPException(status_code=404, detail=f"policy.yaml file not found at {policy_path}")

    try:
        content = policy_path.read_text(encoding="utf-8")
        parsed = yaml.safe_load(content) or {}
        return {"policy_path": str(policy_path), "raw_yaml": content, "parsed": parsed}
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to read policy file: {err}")


@router.put("/policy")
async def update_policy(
    request: PolicyUpdateRequest,
    current_user: Optional[UserDB] = Depends(get_current_user),
) -> dict:
    """
    Secure Policy Editor: updates policy.yaml and hot-reloads the Policy Engine.
    Enforces security validations to prevent unauthorized escalation.
    """
    try:
        # 1. Validate YAML syntax
        parsed = yaml.safe_load(request.policy_yaml)
        if not isinstance(parsed, dict) or "tools" not in parsed:
            raise ValueError("Invalid policy format: must contain top-level 'tools' dictionary.")

        # 2. Validate against dangerous escalation rules
        for tool_name, config in parsed.get("tools", {}).items():
            if not isinstance(config, dict):
                raise ValueError(f"Tool configuration for '{tool_name}' must be a dictionary.")

            # Prevent rogue root directory exposure
            allowed_paths = config.get("conditions", {}).get("allowed_paths", [])
            for p in allowed_paths:
                if p in ["/", "/*", "/**", "/etc/**", "/root/**", "C:\\**"]:
                    raise ValueError(f"Security violation: path '{p}' is dangerously permissive.")

        # 3. Write file
        policy_path = _resolve_policy_path()
        policy_path.write_text(request.policy_yaml, encoding="utf-8")

        # 4. Reload engine singleton immediately
        engine = get_policy_engine()
        engine.policy_path = str(policy_path)
        engine._is_initialized = False
        engine._ensure_initialized()

        logger.info("Policy updated and reloaded by %s", current_user.email if current_user else "admin")

        return {
            "status": "success",
            "message": "Policy validated, saved, and hot-reloaded into Policy Engine.",
            "parsed": parsed,
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))
