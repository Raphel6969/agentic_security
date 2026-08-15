"""
Sentinel SDK — Python client for integrating Sentinel Layer into agent workflows.

Usage:
    from sentinel_sdk import SentinelGuard, SentinelBlocked

    guard = SentinelGuard(
        endpoint="http://localhost:8000",
        token=os.environ["SENTINEL_TOKEN"]
    )

    try:
        guard.run_tool("write_file", {"path": "/sandbox/out.txt", "content": data},
                       incoming_text=user_instruction)
    except SentinelBlocked as e:
        print(f"Blocked: {e.verdict} | Risk: {e.risk_score} | {e.explanation}")
"""
from sentinel_sdk.guard import SentinelGuard
from sentinel_sdk.exceptions import SentinelBlocked, SentinelTokenExpired, SentinelConnectionError

__all__ = ["SentinelGuard", "SentinelBlocked", "SentinelTokenExpired", "SentinelConnectionError"]
__version__ = "0.1.0"
