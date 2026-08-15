"""
LangChain tool wrapper for Sentinel SDK.

Wraps any LangChain BaseTool (or custom callable) to screen inputs and arguments
through SentinelGuard before letting the tool run.
"""
from typing import Any, Callable, Optional
from sentinel_sdk.guard import SentinelGuard


class SentinelToolWrapper:
    """
    Wraps a tool for execution within LangChain or custom agent loops.

    Example:
        guard = SentinelGuard(endpoint="http://localhost:8000", token="...")
        safe_write = SentinelToolWrapper(
            name="write_file",
            func=actual_write_function,
            guard=guard,
            description="Write content to a file safely."
        )
        result = safe_write.run(path="/sandbox/test.txt", content="hello", incoming_text="write hello")
    """

    def __init__(
        self,
        name: str,
        func: Callable[..., Any],
        guard: SentinelGuard,
        description: str = "",
    ):
        self.name = name
        self.func = func
        self.guard = guard
        self.description = description

    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        return self.run(*args, **kwargs)

    def run(
        self,
        incoming_text: str = "",
        incoming_source: str = "user_input",
        **tool_args: Any,
    ) -> Any:
        """
        Screens the call through Sentinel, then invokes the underlying func if allowed.
        Raises SentinelBlocked if blocked.
        """
        return self.guard.run_tool(
            tool_name=self.name,
            arguments=tool_args,
            incoming_text=incoming_text or str(tool_args),
            incoming_source=incoming_source,
            tool_fn=self.func,
        )
