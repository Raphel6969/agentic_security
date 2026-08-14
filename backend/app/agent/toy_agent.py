"""
Toy Agent implementation for Sentinel Layer (Phase 6).

Simulates an enterprise AI agent in both Unprotected Mode (vulnerable)
and Sentinel Protected Mode (secured via /screen screening).
"""
import logging
from typing import Any

from app.agent.tools import execute_tool
from app.models import AgentContext, IncomingContent, ProposedToolCall, ScreenRequest
from app.routers.screen import screen_content

logger = logging.getLogger(__name__)


class ToyAgent:
    """
    Simulated Enterprise AI Assistant that can run in Unprotected or Secured mode.
    """

    def __init__(self, agent_id: str = "enterprise_support_agent", secured: bool = True):
        self.agent_id = agent_id
        self.secured = secured

    async def run_step(
        self,
        incoming_source: str,
        incoming_text: str,
        proposed_tool_name: str,
        proposed_arguments: dict[str, Any] | None = None,
        session_id: str = "session_demo",
    ) -> dict[str, Any]:
        """
        Runs a single tool execution step.

        If self.secured is False: Tool executes directly without screening.
        If self.secured is True: Intercepted by Sentinel Layer (/screen). Tool only executes if verdict != 'block'.
        """
        arguments = proposed_arguments or {}

        # ── 1. Unprotected Mode (Vulnerable) ──────────────────────────────────
        if not self.secured:
            logger.warning("[UNPROTECTED AGENT] Executing tool '%s' with zero screening!", proposed_tool_name)
            tool_output = execute_tool(proposed_tool_name, arguments)
            return {
                "secured": False,
                "agent_id": self.agent_id,
                "session_id": session_id,
                "tool_name": proposed_tool_name,
                "arguments": arguments,
                "tool_executed": True,
                "tool_output": tool_output,
                "screen_response": None,
                "status": "UNPROTECTED_EXECUTION_COMPLETED",
                "security_summary": "[WARNING] Tool executed without security screening (VULNERABLE).",
            }

        # ── 2. Sentinel Protected Mode (Secured) ──────────────────────────────
        logger.info("[SENTINEL PROTECTED AGENT] Intercepting tool '%s' via /screen...", proposed_tool_name)
        screen_request = ScreenRequest(
            agent_context=AgentContext(agent_id=self.agent_id, session_id=session_id),
            incoming_content=IncomingContent(source=incoming_source, text=incoming_text),
            proposed_tool_call=ProposedToolCall(tool_name=proposed_tool_name, arguments=arguments),
        )

        screen_response = await screen_content(screen_request)
        response_dict = screen_response.model_dump()

        if screen_response.verdict == "block":
            logger.error(
                "[SENTINEL INTERCEPTED] Hard Block! Risk score: %.2f. Reason: %s",
                screen_response.risk_score,
                screen_response.explanation,
            )
            return {
                "secured": True,
                "agent_id": self.agent_id,
                "session_id": session_id,
                "tool_name": proposed_tool_name,
                "arguments": arguments,
                "tool_executed": False,
                "tool_output": None,
                "screen_response": response_dict,
                "status": "SENTINEL_BLOCKED_EXECUTION",
                "security_summary": (
                    f"[SENTINEL BLOCKED] Verdict: BLOCK "
                    f"(Risk Score: {screen_response.risk_score:.2f}). {screen_response.explanation}"
                ),
            }

        elif screen_response.verdict == "require_approval":
            logger.warning("[SENTINEL INTERCEPTED] Requires operator approval.")
            return {
                "secured": True,
                "agent_id": self.agent_id,
                "session_id": session_id,
                "tool_name": proposed_tool_name,
                "arguments": arguments,
                "tool_executed": False,
                "tool_output": None,
                "screen_response": response_dict,
                "status": "SENTINEL_REQUIRES_APPROVAL",
                "security_summary": f"[SENTINEL APPROVAL REQUIRED] {screen_response.explanation}",
            }

        # Verdict == ALLOW
        tool_output = execute_tool(proposed_tool_name, arguments)
        return {
            "secured": True,
            "agent_id": self.agent_id,
            "session_id": session_id,
            "tool_name": proposed_tool_name,
            "arguments": arguments,
            "tool_executed": True,
            "tool_output": tool_output,
            "screen_response": response_dict,
            "status": "SENTINEL_ALLOWED_EXECUTION",
            "security_summary": f"[SENTINEL PERMITTED] Execution allowed (Risk Score: {screen_response.risk_score:.2f}).",
        }

