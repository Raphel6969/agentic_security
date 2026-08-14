"""
/screen router for Sentinel Layer.

Phase 4 scope: 3-stage detection cascade (Stage 1 Rule Engine, Stage 2 ML Classifier,
and Stage 3 Groq LLM-Judge) integrated into Verdict Fusion.
"""
from fastapi import APIRouter

from app.models import PolicyCheck, ScreenRequest, ScreenResponse, VerdictType
from app.services.llm_judge import evaluate_llm_judge, should_escalate_to_judge
from app.services.ml_classifier import evaluate_ml
from app.services.rule_engine import evaluate_rules

router = APIRouter(tags=["screening"])


@router.post("/screen", response_model=ScreenResponse)
async def screen_content(request: ScreenRequest) -> ScreenResponse:
    """
    Screen incoming context, content, and proposed tool calls through Sentinel Layer.
    Interprets 3-stage detection cascade signals (Rule, ML Vector Index, LLM-Judge).
    """
    text = request.incoming_content.text
    agent_id = request.agent_context.agent_id
    tool_name = request.proposed_tool_call.tool_name

    # ── Stage 1: Rule Engine Evaluation ──────────────────────────────────────
    rule_score, rule_signals = evaluate_rules(text)

    # ── Stage 2: ML Classifier Evaluation (TurboQuant Index) ─────────────────
    ml_score, ml_signals = evaluate_ml(text)

    # ── Stage 3: LLM-Judge Selective Escalation ─────────────────────────────
    judge_signals = []
    judge_score = None
    judge_reasoning = None

    if should_escalate_to_judge(rule_score, ml_score):
        judge_score, judge_signals, judge_reasoning = evaluate_llm_judge(
            text, agent_id=agent_id, tool_name=tool_name
        )

    # ── Verdict Fusion ────────────────────────────────────────────────────────
    all_scores = [rule_score, ml_score]
    if judge_score is not None:
        all_scores.append(judge_score)

    risk_score = min(1.0, max(all_scores))
    matched_signals = rule_signals + ml_signals + judge_signals

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
        stages_triggered.append(f"Stage 2 ML Vector Index ({', '.join(ml_details)})")

    if judge_signals:
        stages_triggered.append(f"Stage 3 Groq LLM-Judge ({judge_reasoning})")

    if stages_triggered:
        explanation = (
            f"Cascade flagged potential threat via {' & '.join(stages_triggered)}. "
            f"Verdict: {verdict.upper()} (Risk Score: {risk_score:.2f})."
        )
    else:
        explanation = (
            "Content passed 3-stage detection cascade with no matched threats. "
            f"Verdict: ALLOW (Risk Score: {risk_score:.2f})."
        )

    # Policy Check stub (Policy Engine lands in Phase 5)
    policy_check = PolicyCheck(
        tool_name=tool_name,
        allowed=True,
        reason="Phase 4: policy engine not yet active.",
    )

    return ScreenResponse(
        risk_score=risk_score,
        matched_signals=matched_signals,
        verdict=verdict,
        explanation=explanation,
        policy_check=policy_check,
    )
