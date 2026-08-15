# Sentinel SDK

Python client for integrating the **Sentinel Layer** runtime AI firewall into your agentic chains (LangChain, AutoGen, CrewAI, or raw Python).

## Installation

```bash
pip install -e ./sentinel_sdk
```

## Quick Start

```python
import os
from sentinel_sdk import SentinelGuard, SentinelBlocked

# 1. Initialize guard with your 8-hour agent session token
guard = SentinelGuard(
    endpoint="http://localhost:8000",
    token=os.environ["SENTINEL_TOKEN"]
)

# 2. Screen & execute tool calls
try:
    result = guard.run_tool(
        tool_name="write_file",
        arguments={"path": "/sandbox/output.txt", "content": "Report data"},
        incoming_text="Write the report to disk",
        incoming_source="user_input",
        tool_fn=my_write_function  # Optional: executes only if permitted
    )
except SentinelBlocked as e:
    print(f"Attack Blocked: {e.verdict} (Risk: {e.risk_score:.2f}) — {e.explanation}")
```

## LangChain Integration

```python
from sentinel_sdk import SentinelGuard
from sentinel_sdk.langchain import SentinelToolWrapper

guard = SentinelGuard(endpoint="http://localhost:8000", token=os.environ["SENTINEL_TOKEN"])

safe_tool = SentinelToolWrapper(
    name="call_http",
    func=actual_http_call,
    guard=guard,
    description="Makes external API calls safely"
)

# Use in your tool list
tools = [safe_tool]
```
