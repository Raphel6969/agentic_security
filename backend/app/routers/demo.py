"""
/demo router for Sentinel Layer (Phase 6).
Provides REST endpoints for executing staged attack scenarios and returning comparative side-by-side JSON.
"""
from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.scenarios.attack_scenarios import SCENARIO_DEFINITIONS, run_scenario

router = APIRouter(prefix="/demo", tags=["demonstration"])


class ScenarioRunRequest(BaseModel):
    scenario_id: int = Field(..., ge=1, le=3, description="Scenario ID to execute (1, 2, or 3)")


@router.get("/scenarios")
async def list_scenarios() -> dict[str, Any]:
    """Lists available staged attack scenario metadata."""
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
    """
    Executes a staged attack scenario side-by-side (Unprotected vs Sentinel Protected).
    """
    try:
        return await run_scenario(request.scenario_id)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
