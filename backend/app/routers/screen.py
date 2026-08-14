"""
/screen router for Sentinel Layer.

Phase 3 scope: Stage 1 Rule Engine and Stage 2 ML Classifier (TurboQuant vector index)
integrated into Verdict Fusion. Evaluates incoming_content against regex signatures
and dense semantic vector embeddings.
"""
from fastapi import APIRouter

from app.models import PolicyCheck, ScreenRequest, ScreenResponse, VerdictType
from app.services.ml_classifier import evaluate_ml
from app.services.rule_engine import evaluate_rules

router = APIRouter(tags=["screening"])


@router.post("/screen", response_model=ScreenResponse)
async def screen_content(request: ScreenRequest) -> ScreenResponse:
    """
    Screen incoming context, content, and proposed tool calls through Sentinel Layer.
    Interprets Stage 1 (Rule Engine) and Stage 2 (ML Classifier) signals.
    """
    text = request.incoming_content.text

    # ── Stage 1: Rule Engine Evaluation ──────────────────────────────────────
    rule_score, rule_signals = evaluate_rules(text)

    # ── Stage 2: ML Classifier Evaluation (TurboQuant Index) ─────────────────
    ml_score, ml_signals = evaluate_ml(text)

    # ── Verdict Fusion ────────────────────────────────────────────────────────
    matched_signals = rule_signals + ml_signals
    risk_score = min(1.0, max(rule_score, ml_score))

    if risk_score >= 0.7:
        verdict: VerdictType = "block"
    elif risk_score >= 0.4:
        verdict = "require_approval"
    else:
        verdict = "allow"

    # ── Explanation Generation ────────────────────────────────────────────────
    stages_triggered = []
    if rule_signals:
        rule_names = [s.signal for s in rule_signals]
        stages_triggered.append(f"Stage 1 Rules ({', '.join(rule_names)})")

    if ml_signals:
        ml_details = [f"{s.score:.2f}" for s in ml_signals if s.score is not None]
        stages_triggered.append(f"Stage 2 ML Vector Index (similarity {', '.join(ml_details)})")

    if stages_triggered:
        explanation = (
            f"Cascade flagged potential threat via {' & '.join(stages_triggered)}. "
            f"Verdict: {verdict.upper()} (Risk Score: {risk_score:.2f})."
        )
    else:
        explanation = (
            "Content passed Stage 1 rules and Stage 2 ML similarity checks. "
            f"Verdict: ALLOW (Risk Score: {risk_score:.2f})."
        )

    # Policy Check stub (Policy Engine lands in Phase 5)
    policy_check = PolicyCheck(
        tool_name=request.proposed_tool_call.tool_name,
        allowed=True,
        reason="Phase 3: policy engine not yet active.",
    )

    return ScreenResponse(
        risk_score=risk_score,
        matched_signals=matched_signals,
        verdict=verdict,
        explanation=explanation,
        policy_check=policy_check,
    )
