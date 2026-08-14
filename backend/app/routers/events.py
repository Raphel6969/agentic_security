"""
/events & /policy router for Sentinel Layer (Phase 7).

Provides REST & SSE endpoints for live telemetry stream, SQLite hot storage audit logs,
analytics statistics, and dynamic policy management for Phase 7 Dashboard.
"""
import asyncio
import json
import logging
from pathlib import Path
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import yaml

from app.config import get_settings
from app.db.models import ScreenEventDB
from app.db.session import SessionLocal
from app.services.policy_engine import get_policy_engine

logger = logging.getLogger(__name__)
router = APIRouter(tags=["telemetry"])

# Global event queue for real-time SSE broadcasting
_event_listeners: list[asyncio.Queue] = []


def broadcast_event(event_data: dict):
    """Utility to broadcast new screen events to all connected SSE clients."""
    for queue in _event_listeners:
        try:
            queue.put_nowait(event_data)
        except Exception:
            pass


@router.get("/events/history")
async def get_event_history(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    verdict: str | None = None,
) -> dict:
    """Returns historical screened event logs from SQLite Hot Storage."""
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
                    "matched_signals": json.loads(r.matched_signals_json) if r.matched_signals_json else [],
                    "policy_allowed": r.policy_allowed,
                    "policy_reason": r.policy_reason,
                }
            )

        return {"events": events, "total": total_count, "limit": limit, "offset": offset}


@router.get("/events/stats")
async def get_event_stats() -> dict:
    """Returns analytics summary from SQLite Hot Storage."""
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

        return {
            "total_screened": total,
            "blocked": blocks,
            "allowed": allows,
            "requires_approval": approvals,
            "average_risk_score": round(avg_score, 3),
            "block_rate": round(blocks / total, 3) if total > 0 else 0.0,
        }


@router.get("/events/stream")
async def stream_events() -> StreamingResponse:
    """Server-Sent Events (SSE) endpoint streaming real-time screening decisions."""

    async def event_generator() -> AsyncGenerator[str, None]:
        queue: asyncio.Queue = asyncio.Queue()
        _event_listeners.append(queue)
        try:
            # Yield initial connection message
            yield f"data: {json.dumps({'type': 'CONNECTED', 'message': 'Sentinel Telemetry Stream Active'})}\n\n"
            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if queue in _event_listeners:
                _event_listeners.remove(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


class PolicyUpdateRequest(BaseModel):
    policy_yaml: str


@router.get("/policy")
async def get_policy() -> dict:
    """Returns the current policy.yaml configuration."""
    settings = get_settings()
    policy_path = Path(settings.policy_file_path)

    if not policy_path.exists():
        root_policy = Path(__file__).parent.parent.parent.parent / "policy" / "policy.example.yaml"
        if root_policy.exists():
            policy_path = root_policy

    if not policy_path.exists():
        raise HTTPException(status_code=404, detail="policy.yaml file not found.")

    try:
        content = policy_path.read_text(encoding="utf-8")
        parsed = yaml.safe_load(content) or {}
        return {"policy_path": str(policy_path), "raw_yaml": content, "parsed": parsed}
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to read policy file: {err}")


@router.put("/policy")
async def update_policy(request: PolicyUpdateRequest) -> dict:
    """Updates policy.yaml configuration and reloads Policy Engine."""
    try:
        # Validate YAML syntax
        parsed = yaml.safe_load(request.policy_yaml)
        if not isinstance(parsed, dict) or "tools" not in parsed:
            raise ValueError("Invalid policy format: must contain top-level 'tools' dictionary.")

        settings = get_settings()
        policy_path = Path(settings.policy_file_path)
        policy_path.write_text(request.policy_yaml, encoding="utf-8")

        # Reload engine singleton
        engine = get_policy_engine()
        engine._is_initialized = False
        engine._ensure_initialized()

        return {"status": "success", "message": "Policy updated and reloaded successfully.", "parsed": parsed}
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Invalid policy YAML: {err}")
