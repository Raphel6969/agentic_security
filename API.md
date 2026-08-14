# API.md — Sentinel Layer API Contract

This document defines the request/response contract for the Sentinel Layer
backend. It is the source of truth for both the agent-side client SDK and
the dashboard — if behaviour and this doc disagree, that's a bug in one of
them, and it should be fixed and noted in `docs/decisions.md`.

## `GET /health`

Phase 0 baseline endpoint. Confirms the service is up.

**Response `200 OK`**
```json
{ "status": "ok", "version": "0.1.0" }
```

## `POST /screen`  *(Phase 1–4)*

The core endpoint. Screens incoming content and/or a proposed tool call.

### Request

```json
{
  "agent_context": {
    "agent_id": "string",
    "session_id": "string",
    "recent_tool_calls": ["read_email", "read_email"]
  },
  "incoming_content": {
    "source": "user_input | retrieved_document | system",
    "text": "string"
  },
  "proposed_tool_call": {
    "tool_name": "string",
    "arguments": { "...": "..." }
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `agent_context.agent_id` | string | yes | Identifies which agent/integration is calling. |
| `agent_context.session_id` | string | yes | Groups calls into a session for behavioural-deviation scoring. |
| `agent_context.recent_tool_calls` | array[string] | no | Recent call history, used by the session-behaviour parameter. |
| `incoming_content.source` | enum | yes | `user_input`, `retrieved_document`, or `system` — drives the content-source trust parameter (report, Ch.11). |
| `incoming_content.text` | string | yes | The raw text being screened. |
| `proposed_tool_call.tool_name` | string | yes | Must match a tool declared in `policy.yaml`. |
| `proposed_tool_call.arguments` | object | no | Tool-specific arguments, checked against policy scope. |

### Response

```json
{
  "risk_score": 0.83,
  "matched_signals": [
    { "stage": "rule", "signal": "instruction_override_phrase", "detail": "\"ignore previous instructions\"" },
    { "stage": "ml", "signal": "high_similarity_to_known_injection", "score": 0.81 }
  ],
  "verdict": "block",
  "explanation": "This content contains a direct instruction-override phrase and is highly similar to known prompt-injection examples. The proposed tool call (send_email) was blocked before execution.",
  "policy_check": {
    "tool_name": "send_email",
    "allowed": false,
    "reason": "risk_score exceeds policy threshold for this tool"
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `risk_score` | float [0,1] | Fused score from Verdict Fusion (report, Ch.11.3). |
| `matched_signals` | array | Every signal that contributed, tagged by which stage produced it. |
| `verdict` | enum | `allow`, `block`, or `require_approval`. |
| `explanation` | string | Plain-language reason — this is the field the dashboard and demo lean on hardest. |
| `policy_check` | object | Independent policy result; can force `block` even at low `risk_score`. |

### Error responses

| Status | Meaning |
|---|---|
| `400` | Malformed request (missing required field, invalid `source` enum, etc.) |
| `422` | Well-formed but semantically invalid (e.g. `tool_name` not declared in `policy.yaml`) |
| `503` | LLM-judge (Stage 3) unreachable and no cached fallback verdict available — see `docs/decisions.md` for the agreed fallback behaviour once Phase 4 lands |

## Planned/future endpoints *(not in scope until noted phase lands)*

| Endpoint | Phase | Purpose |
|---|---|---|
| `GET /audit` | 7 | Paginated verdict history for the dashboard |
| `WS /feed` | 7 | Real-time verdict stream for the dashboard's live feed |
| `PUT /policy` | 7 (stretch) | Live policy editing from the dashboard, for the demo's policy-toggle beat |

This table is a plan, not a commitment — do not implement ahead of the
phase it's listed under (see `RULE.md` Section A.2).
