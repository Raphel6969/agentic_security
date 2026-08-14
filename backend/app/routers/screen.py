"""
/screen router for Sentinel Layer.

Phase 5 scope: 3-stage detection cascade + Policy Engine authorization & SQLite Hot Storage audit logging.
Hard policy violations force a 'block' verdict independent of risk_score.
"""
import json
import logging
from fastapi import APIRouter

from app.db.models import ScreenEventDB
from app.db.session import SessionLocal
from app.models import ScreenRequest, ScreenResponse, VerdictType
from app.services.llm_judge import evaluate_llm_judge, should_escalate_to_judge
from app.services.ml_classifier import evaluate_ml
from app.services.policy_engine import evaluate_policy
from app.services.rule_engine import evaluate_rules

logger = logging.getLogger(__name__)
router = APIRouter(tags=["screening"])


@router.post("/screen", response_model=ScreenResponse)
async def screen_content(request: ScreenRequest) -> ScreenResponse:
    """
    Screen incoming context, content, and proposed tool calls through Sentinel Layer.
    Combines 3-stage threat detection cascade with declarative Policy Engine authorization.
    """
    text = request.incoming_content.text
    agent_id = request.agent_context.agent_id
    session_id = request.agent_context.session_id
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

    # ── Policy Engine Evaluation & Hard Enforcement ───────────────────────────
    policy_check = evaluate_policy(request.proposed_tool_call, request.agent_context)

    # Hard Policy Override: Policy violation forces BLOCK independent of risk_score
    if not policy_check.allowed:
        verdict = "block"
        explanation = (
            f"{explanation} Hard Policy Violation: {policy_check.reason} "
            "Verdict forced to BLOCK."
        )
    elif "requires_approval" in policy_check.reason and verdict != "block":
        verdict = "require_approval"
        explanation += " Policy scope requires operator approval before execution."


    # ── SQLite Hot Storage Audit Logging & SSE Telemetry Broadcast ────────────
    try:
        signals_json = json.dumps([s.model_dump() for s in matched_signals])
        with SessionLocal() as db:
            event_row = ScreenEventDB(
                agent_id=agent_id,
                session_id=session_id,
                tool_name=tool_name,
                incoming_source=request.incoming_content.source,
                risk_score=risk_score,
                verdict=verdict,
                explanation=explanation,
                matched_signals_json=signals_json,
                policy_allowed=policy_check.allowed,
                policy_reason=policy_check.reason,
            )
            db.add(event_row)
            db.commit()

        # Broadcast SSE live stream event
        from app.routers.events import broadcast_event
        broadcast_event({
            "type": "SCREEN_DECISION",
            "agent_id": agent_id,
            "session_id": session_id,
            "tool_name": tool_name,
            "incoming_source": request.incoming_content.source,
            "risk_score": risk_score,
            "verdict": verdict,
            "explanation": explanation,
            "matched_signals": [s.model_dump() for s in matched_signals],
            "policy_check": policy_check.model_dump(),
        })
    except Exception as err:
        logger.warning("Failed to log screen event to SQLite hot storage: %s", err)

    return ScreenResponse(
        risk_score=risk_score,
        matched_signals=matched_signals,
        verdict=verdict,
        explanation=explanation,
        policy_check=policy_check,
    )

