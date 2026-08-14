"""
/screen router for Sentinel Layer.

Phase 1 scope: Stub endpoint accepting full ScreenRequest shape and returning a
valid ScreenResponse matching API.md. Detection and policy logic arrive in Phase 2+.
"""
from fastapi import APIRouter

from app.models import PolicyCheck, ScreenRequest, ScreenResponse

router = APIRouter(tags=["screening"])


@router.post("/screen", response_model=ScreenResponse)
async def screen_content(request: ScreenRequest) -> ScreenResponse:
    """
    Screen incoming context, content, and proposed tool calls.

    # STUB: Returns a default permissive verdict in Phase 1. Real detection
    # and policy evaluation land in Phases 2-5.
    """
    return ScreenResponse(
        risk_score=0.0,
        matched_signals=[],
        verdict="allow",
        explanation=(
            "Phase 1 stub response: content screening stubbed as safe. "
            "Detection stages land in Phase 2-4."
        ),
        policy_check=PolicyCheck(
            tool_name=request.proposed_tool_call.tool_name,
            allowed=True,
            reason="Phase 1 stub: policy engine not yet active.",
        ),
    )
