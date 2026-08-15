"""
SentinelGuard — core SDK class for integrating Sentinel into agent workflows.
"""
import os
from typing import Any, Optional

import httpx

from sentinel_sdk.exceptions import SentinelBlocked, SentinelConnectionError, SentinelTokenExpired


class SentinelGuard:
    """
    Drop-in Sentinel middleware for any Python agent.

    Args:
        endpoint: Sentinel API base URL (e.g., "http://localhost:8000")
        token: Agent session token (from SENTINEL_TOKEN env var or dashboard)
        agent_id: Identifier for this agent instance
        timeout: HTTP timeout in seconds

    Example:
        guard = SentinelGuard(
            endpoint="http://localhost:8000",
            token=os.environ["SENTINEL_TOKEN"]
        )
        guard.run_tool("search_web", {"query": "AI safety"}, incoming_text="Find AI safety news")
    """

    def __init__(
        self,
        endpoint: str = "http://localhost:8000",
        token: Optional[str] = None,
        agent_id: str = "sentinel_sdk_agent",
        session_id: Optional[str] = None,
        timeout: float = 10.0,
    ):
        self.endpoint = endpoint.rstrip("/")
        self.token = token or os.environ.get("SENTINEL_TOKEN", "")
        self.agent_id = agent_id
        self.session_id = session_id or f"sdk_session_{os.getpid()}"
        self.timeout = timeout

        if not self.token:
            raise ValueError(
                "No Sentinel token provided. Set SENTINEL_TOKEN env var or pass token= argument.\n"
                "Generate a token at: POST /tokens/agent (requires dashboard login)"
            )

    def _headers(self) -> dict:
        return {
            "X-Sentinel-Token": self.token,
            "Content-Type": "application/json",
        }

    def screen(
        self,
        tool_name: str,
        arguments: dict[str, Any],
        incoming_text: str,
        incoming_source: str = "user_input",
    ) -> dict:
        """
        Screen a proposed tool call through Sentinel.
        Returns the full screening response dict.
        Raises SentinelBlocked if verdict is 'block'.
        Raises SentinelTokenExpired if token is invalid/expired.
        Raises SentinelConnectionError if Sentinel is unreachable.
        """
        payload = {
            "incoming_content": {"source": incoming_source, "text": incoming_text},
            "proposed_tool_call": {"tool_name": tool_name, "arguments": arguments},
            "agent_context": {"agent_id": self.agent_id, "session_id": self.session_id},
        }

        try:
            resp = httpx.post(
                f"{self.endpoint}/screen",
                json=payload,
                headers=self._headers(),
                timeout=self.timeout,
            )
        except httpx.ConnectError as e:
            raise SentinelConnectionError(f"Cannot reach Sentinel at {self.endpoint}: {e}")

        if resp.status_code == 401:
            raise SentinelTokenExpired("Agent session token is invalid or expired. Regenerate via dashboard.")

        resp.raise_for_status()
        result = resp.json()

        if result.get("verdict") == "block":
            raise SentinelBlocked(
                verdict=result["verdict"],
                risk_score=result.get("risk_score", 0.0),
                explanation=result.get("explanation", ""),
                matched_signals=result.get("matched_signals", []),
                policy_check=result.get("policy_check", {}),
            )

        return result

    def run_tool(
        self,
        tool_name: str,
        arguments: Optional[dict[str, Any]] = None,
        incoming_text: str = "",
        incoming_source: str = "user_input",
        tool_fn: Optional[Any] = None,
        **kwargs: Any,
    ) -> Any:
        """
        Screen + execute a tool call.
        If Sentinel allows it and tool_fn is provided, executes tool_fn(**arguments).
        If Sentinel blocks, raises SentinelBlocked.

        Args:
            tool_name: Name of the tool to call
            arguments: Optional Tool arguments dict
            incoming_text: The instruction/content that led to this tool call
            incoming_source: "user_input" | "retrieved_document" | "agent_generated"
            tool_fn: Optional callable to execute if allowed
            **kwargs: Extra keyword arguments passed directly to the tool

        Returns:
            tool_fn(**arguments) result if provided, else the screen response dict
        """
        final_args = {}
        if arguments and isinstance(arguments, dict):
            final_args.update(arguments)
        if kwargs:
            final_args.update(kwargs)

        # Support 'source' as alias for incoming_source and prevent forwarding to tool_fn
        if "source" in final_args:
            incoming_source = final_args.pop("source")
        if "incoming_source" in final_args:
            incoming_source = final_args.pop("incoming_source")
        if "incoming_text" in final_args:
            incoming_text = final_args.pop("incoming_text")

        screen_result = self.screen(tool_name, final_args, incoming_text, incoming_source)

        if tool_fn is not None:
            return tool_fn(**final_args)

        return screen_result

    def screen_content_only(self, text: str, tool_name: str = "none", source: str = "retrieved_document") -> dict:
        """
        Screen text content without a specific tool call (e.g., after extracting PDF text).
        Useful for pre-screening documents before deciding what to do with them.
        """
        return self.screen(tool_name, {}, text, source)
