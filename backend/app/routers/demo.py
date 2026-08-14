"""
Extended demo router for Phase 9 Live Demo mode.

Adds:
  POST /demo/seed          — Silently run all 3 scenarios to pre-populate DB + SSE stream.
  POST /demo/live-run      — Run a single named scenario and stream result events via SSE.
  POST /demo/continuous    — Launch a background task that continuously cycles agent activity.
  GET  /demo/continuous/stop — Stop the continuous background loop.
"""
import asyncio
import logging
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from app.scenarios.attack_scenarios import SCENARIO_DEFINITIONS, run_scenario

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/demo", tags=["demonstration"])

# ── Global continuous loop control ────────────────────────────────────────────
_continuous_task: asyncio.Task | None = None
_continuous_running = False


class ScenarioRunRequest(BaseModel):
    scenario_id: int = Field(..., ge=1, le=3)


@router.get("/scenarios")
async def list_scenarios() -> dict[str, Any]:
    scenarios = [
        {
            "scenario_id": s["scenario_id"],
            "title": s["title"],
            "description": s["description"],
            "incoming_source": s["incoming_source"],
            "proposed_tool_name": s["proposed_tool_name"],
        }
        for s in SCENARIO_DEFINITIONS.values()
    ]
    return {"scenarios": scenarios, "count": len(scenarios)}


@router.post("/run-scenario")
async def execute_scenario_endpoint(request: ScenarioRunRequest) -> dict[str, Any]:
    """Run a single attack scenario and return the full comparative result."""
    try:
        return await run_scenario(request.scenario_id)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@router.post("/seed")
async def seed_demo_data() -> dict[str, Any]:
    """
    Silently run all 3 scenarios to pre-populate SQLite Hot Storage
    and SSE stream. Call once on dashboard load to ensure metrics are
    non-zero and the audit log is populated.
    """
    results = []
    for sid in [1, 2, 3]:
        try:
            result = await run_scenario(sid)
            results.append({
                "scenario_id": sid,
                "title": result["title"],
                "protected_verdict": result["protected_run"]["screen_response"]["verdict"],
                "risk_score": result["protected_run"]["screen_response"]["risk_score"],
                "attack_prevented": result["comparison_summary"]["attack_prevented"],
            })
        except Exception as exc:
            logger.warning("Seed scenario %d failed: %s", sid, exc)

    return {"status": "seeded", "scenarios_run": len(results), "results": results}


async def _continuous_loop(cycles: int = 0):
    """
    Continuously cycle through all 3 attack scenarios in sequence.
    Broadcasts SSE events for each screening decision.
    cycles=0 means run until stopped.
    """
    global _continuous_running
    _continuous_running = True
    count = 0
    scenario_ids = [1, 2, 3]

    # Also add a few "clean" agent calls to show normal operation
    from app.agent.toy_agent import ToyAgent
    from app.routers.events import broadcast_event

    clean_calls = [
        {"tool": "search_web", "text": "Find the latest Python security advisories.", "args": {"query": "python security CVE 2024"}},
        {"tool": "read_email", "text": "Check inbox for pending approvals.", "args": {"email_id": "inbox_001"}},
        {"tool": "execute_sql", "text": "Run daily analytics query.", "args": {"query": "SELECT COUNT(*) FROM events WHERE date = CURRENT_DATE", "database": "analytics"}},
    ]

    idx = 0
    try:
        while _continuous_running and (cycles == 0 or count < cycles):
            # Alternate between a clean call and an attack scenario
            if idx % 2 == 0:
                # Clean legitimate agent call — should pass
                clean = clean_calls[idx % len(clean_calls)]
                try:
                    agent = ToyAgent(agent_id="live_demo_agent", secured=True)
                    result = await agent.run_step(
                        incoming_source="user_input",
                        incoming_text=clean["text"],
                        proposed_tool_name=clean["tool"],
                        proposed_arguments=clean["args"],
                        session_id=f"live_session_{count}",
                    )
                    # Broadcast a user-friendly SSE event
                    broadcast_event({
                        "type": "AGENT_STEP",
                        "agent_id": "live_demo_agent",
                        "session_id": f"live_session_{count}",
                        "tool_name": clean["tool"],
                        "incoming_text": clean["text"][:80],
                        "verdict": result.get("screen_response", {}).get("verdict", "allow") if result.get("screen_response") else "allow",
                        "risk_score": result.get("screen_response", {}).get("risk_score", 0.0) if result.get("screen_response") else 0.0,
                        "explanation": result.get("screen_response", {}).get("explanation", "Passed — clean request.") if result.get("screen_response") else "Passed — clean request.",
                        "attack": False,
                    })
                except Exception as exc:
                    logger.debug("Clean call failed in continuous loop: %s", exc)
            else:
                # Attack scenario
                sid = scenario_ids[idx % len(scenario_ids)]
                try:
                    result = await run_scenario(sid)
                    screen = result["protected_run"]["screen_response"]
                    spec = SCENARIO_DEFINITIONS[sid]
                    broadcast_event({
                        "type": "AGENT_STEP",
                        "agent_id": "live_demo_agent",
                        "session_id": f"live_session_{count}",
                        "tool_name": spec["proposed_tool_name"],
                        "incoming_text": spec["incoming_text"][:80],
                        "verdict": screen["verdict"],
                        "risk_score": screen["risk_score"],
                        "explanation": screen["explanation"],
                        "attack": True,
                        "scenario_id": sid,
                    })
                except Exception as exc:
                    logger.debug("Attack scenario %d failed in continuous loop: %s", sid, exc)

            idx += 1
            count += 1

            # Pace: 2.5s between events so the stream feels alive but readable
            await asyncio.sleep(2.5)

    except asyncio.CancelledError:
        pass
    finally:
        _continuous_running = False
        logger.info("Continuous demo loop ended after %d steps.", count)


@router.post("/continuous")
async def start_continuous(background_tasks: BackgroundTasks, cycles: int = 0) -> dict[str, Any]:
    """
    Start a continuous background agent simulation.
    Mix of clean calls + attack scenarios, broadcasting live SSE events.
    cycles=0 = run indefinitely until /demo/continuous/stop is called.
    """
    global _continuous_task, _continuous_running

    if _continuous_running:
        return {"status": "already_running", "message": "Continuous demo already active."}

    async def _runner():
        await _continuous_loop(cycles)

    background_tasks.add_task(_runner)
    return {"status": "started", "message": "Live agent simulation started. Events streaming via SSE."}


@router.post("/continuous/stop")
async def stop_continuous() -> dict[str, Any]:
    """Stop the continuous background demo loop."""
    global _continuous_running
    _continuous_running = False
    return {"status": "stopping", "message": "Continuous demo will stop after current step."}
