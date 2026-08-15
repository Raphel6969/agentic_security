"""
/screen router for Sentinel Layer.

Phase 10 scope: Stage 0 (token permission check) added before 3-stage cascade.
- If X-Sentinel-Token present: validates token, checks tool permission, tags events with user identity.
- If no token: backward-compatible, runs full 3-stage cascade as before.
- Stage 0 block is instant (zero ML/LLM cost).
"""
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header

from app.db.models import ScreenEventDB
from app.db.session import SessionLocal
from app.middleware.auth import read_agent_token
from app.models import ScreenRequest, ScreenResponse, VerdictType, PolicyCheck
from app.services.llm_judge import evaluate_llm_judge, should_escalate_to_judge
from app.services.ml_classifier import evaluate_ml
from app.services.policy_engine import evaluate_policy
from app.services.rule_engine import evaluate_rules

logger = logging.getLogger(__name__)
router = APIRouter(tags=["screening"])


@router.post("/screen", response_model=ScreenResponse)
async def screen_content(
    request: ScreenRequest,
    agent_token: Optional[dict] = Depends(read_agent_token),
) -> ScreenResponse:
    """
    Screen incoming context, content, and proposed tool calls through Sentinel Layer.

    Stage 0 (Phase 10): Token permission check — instant block if role lacks permission.
    Stage 1: Rule Engine (regex + pattern matching)
    Stage 2: ML Classifier (TurboQuant vector index)
    Stage 3: LLM-Judge (selective Groq escalation)
    Policy Engine: declarative YAML hard enforcement
    """
    text       = request.incoming_content.text
    agent_id   = request.agent_context.agent_id
    session_id = request.agent_context.session_id
    tool_name  = request.proposed_tool_call.tool_name

    # Identity from token (None if no token provided or if invoked directly in python)
    token_dict: Optional[dict] = agent_token if isinstance(agent_token, dict) else None
    user_id    = token_dict.get("sub")    if token_dict else None
    user_email = token_dict.get("email")  if token_dict else None
    user_role  = token_dict.get("role")   if token_dict else None

    # ── Stage 0: Token Permission Check ──────────────────────────────────────
    if token_dict:
        permissions: dict = token_dict.get("permissions", {})
        if not permissions.get(tool_name, True):
            # Hard block — cheaper than any cascade stage
            explanation = (
                f"Stage 0 Permission Block: Role '{user_role}' does not have permission "
                f"to call '{tool_name}'. Blocked before cascade. No ML/LLM cost incurred."
            )
            _log_event(
                agent_id=agent_id, session_id=session_id, tool_name=tool_name,
                incoming_source=request.incoming_content.source,
                risk_score=0.0, verdict="block",
                explanation=explanation, matched_signals_json="[]",
                policy_allowed=False, policy_reason="Token permission denied.",
                user_id=user_id, user_email=user_email, user_role=user_role,
            )
            from app.routers.events import broadcast_event
            broadcast_event({
                "type": "SCREEN_DECISION", "agent_id": agent_id, "session_id": session_id,
                "tool_name": tool_name, "incoming_source": request.incoming_content.source,
                "risk_score": 0.0, "verdict": "block", "explanation": explanation,
                "matched_signals": [], "policy_check": {"allowed": False, "reason": "Token permission denied."},
                "user_id": user_id, "user_email": user_email, "user_role": user_role,
                "stage_0_block": True,
            })
            return ScreenResponse(
                risk_score=0.0,
                matched_signals=[],
                verdict="block",
                explanation=explanation,
                policy_check=PolicyCheck(tool_name=tool_name, allowed=False, reason="Token permission denied."),
            )

    # ── Stage 1: Rule Engine ──────────────────────────────────────────────────
    rule_score, rule_signals = evaluate_rules(text)

    # ── Stage 2: ML Classifier ────────────────────────────────────────────────
    ml_score, ml_signals = evaluate_ml(text)

    # ── Stage 3: LLM-Judge (selective) ───────────────────────────────────────
    judge_signals  = []
    judge_score    = None
    judge_reasoning = None

    if should_escalate_to_judge(rule_score, ml_score):
        judge_score, judge_signals, judge_reasoning = evaluate_llm_judge(
            text, agent_id=agent_id, tool_name=tool_name
        )

    # ── Verdict Fusion ────────────────────────────────────────────────────────
    all_scores    = [rule_score, ml_score]
    if judge_score is not None:
        all_scores.append(judge_score)

    risk_score      = min(1.0, max(all_scores))
    matched_signals = rule_signals + ml_signals + judge_signals

    if risk_score >= 0.7:
        verdict: VerdictType = "block"
    elif risk_score >= 0.4:
        verdict = "require_approval"
    else:
        verdict = "allow"

    # ── Explanation ───────────────────────────────────────────────────────────
    stages_triggered = []
    if rule_signals:
        stages_triggered.append(f"Stage 1 Rules ({', '.join(s.signal for s in rule_signals)})")
    if ml_signals:
        ml_details = [f"{s.score:.2f}" for s in ml_signals if s.score is not None]
        stages_triggered.append(f"Stage 2 ML Vector Index ({', '.join(ml_details)})")
    if judge_signals:
        stages_triggered.append(f"Stage 3 Groq LLM-Judge ({judge_reasoning})")

    if stages_triggered:
        explanation = (
            f"Cascade flagged threat via {' & '.join(stages_triggered)}. "
            f"Verdict: {verdict.upper()} (Risk: {risk_score:.2f})."
        )
    else:
        explanation = (
            f"Content passed 3-stage cascade with no matched threats. "
            f"Verdict: ALLOW (Risk: {risk_score:.2f})."
        )

    # ── Policy Engine ─────────────────────────────────────────────────────────
    policy_check = evaluate_policy(request.proposed_tool_call, request.agent_context)

    if not policy_check.allowed:
        verdict = "block"
        explanation += f" Hard Policy Violation: {policy_check.reason} Verdict forced to BLOCK."
    elif "requires_approval" in policy_check.reason and verdict != "block":
        verdict = "require_approval"
        explanation += " Policy scope requires operator approval."

    # ── Audit + SSE Broadcast ─────────────────────────────────────────────────
    signals_json = json.dumps([s.model_dump() for s in matched_signals])
    try:
        _log_event(
            agent_id=agent_id, session_id=session_id, tool_name=tool_name,
            incoming_source=request.incoming_content.source,
            risk_score=risk_score, verdict=verdict,
            explanation=explanation, matched_signals_json=signals_json,
            policy_allowed=policy_check.allowed, policy_reason=policy_check.reason,
            user_id=user_id, user_email=user_email, user_role=user_role,
        )
        from app.routers.events import broadcast_event
        broadcast_event({
            "type": "SCREEN_DECISION", "agent_id": agent_id, "session_id": session_id,
            "tool_name": tool_name, "incoming_source": request.incoming_content.source,
            "risk_score": risk_score, "verdict": verdict, "explanation": explanation,
            "matched_signals": [s.model_dump() for s in matched_signals],
            "policy_check": policy_check.model_dump(),
            "user_id": user_id, "user_email": user_email, "user_role": user_role,
        })
    except Exception as err:
        logger.warning("Failed to log screen event: %s", err)

    return ScreenResponse(
        risk_score=risk_score,
        matched_signals=matched_signals,
        verdict=verdict,
        explanation=explanation,
        policy_check=policy_check,
    )


def _log_event(
    agent_id: str, session_id: str, tool_name: str, incoming_source: str,
    risk_score: float, verdict: str, explanation: str,
    matched_signals_json: str, policy_allowed: bool, policy_reason: str,
    user_id: Optional[str] = None, user_email: Optional[str] = None, user_role: Optional[str] = None,
) -> None:
    with SessionLocal() as db:
        db.add(ScreenEventDB(
            agent_id=agent_id, session_id=session_id, tool_name=tool_name,
            incoming_source=incoming_source, risk_score=risk_score, verdict=verdict,
            explanation=explanation, matched_signals_json=matched_signals_json,
            policy_allowed=policy_allowed, policy_reason=policy_reason,
            user_id=user_id, user_email=user_email, user_role=user_role,
        ))
        db.commit()
