"""
/screen router for Sentinel Layer.

Phase 2 scope: Stage 1 Rule Engine integrated. Evaluates incoming_content against
known prompt injection and jailbreak signatures.
"""
from fastapi import APIRouter

from app.models import PolicyCheck, ScreenRequest, ScreenResponse, VerdictType
from app.services.rule_engine import evaluate_rules

router = APIRouter(tags=["screening"])


@router.post("/screen", response_model=ScreenResponse)
async def screen_content(request: ScreenRequest) -> ScreenResponse:
    """
    Screen incoming context, content, and proposed tool calls through Sentinel Layer.
    """
    # ── Stage 1: Rule Engine Evaluation ──────────────────────────────────────
    rule_score, rule_signals = evaluate_rules(request.incoming_content.text)

    risk_score = rule_score
    matched_signals = rule_signals

    # ── Verdict Decision Logic ────────────────────────────────────────────────
    if risk_score >= 0.7:
        verdict: VerdictType = "block"
    elif risk_score >= 0.4:
        verdict = "require_approval"
    else:
        verdict = "allow"

    # ── Explanation Generation ────────────────────────────────────────────────
    if matched_signals:
        signal_names = [s.signal for s in matched_signals]
        explanation = (
            f"Stage 1 Rule Engine flagged potential risk ({', '.join(signal_names)}). "
            f"Verdict: {verdict.upper()} (Risk Score: {risk_score})."
        )
    else:
        explanation = (
            "Content passed Stage 1 rule checks with no matched threat signatures. "
            f"Verdict: ALLOW (Risk Score: {risk_score})."
        )

    # Policy Check stub (Policy Engine lands in Phase 5)
    policy_check = PolicyCheck(
        tool_name=request.proposed_tool_call.tool_name,
        allowed=True,
        reason="Phase 2: policy engine not yet active.",
    )

    return ScreenResponse(
        risk_score=risk_score,
        matched_signals=matched_signals,
        verdict=verdict,
        explanation=explanation,
        policy_check=policy_check,
    )
