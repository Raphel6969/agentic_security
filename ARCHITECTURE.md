# ARCHITECTURE.md — Sentinel Layer Technical Architecture

Reference architecture for the system. For the market/problem rationale
behind these choices, see the project report
(`Sentinel_Layer_Deep_Dive_Report.pdf`), Chapters 4–6 and 11.

## System overview

Sentinel Layer is a proxy-and-policy system, not a new foundation model. It
intercepts two moments in an agent's lifecycle:

1. When untrusted content enters the agent's context (an email, a web page,
   a GitHub issue, a retrieved document).
2. When the agent proposes a tool call (send email, write file, call an
   HTTP endpoint, etc.).

```
                     ┌─────────────────────────────────────────┐
                     │              Sentinel Layer              │
                     │                (FastAPI)                 │
  Agent / toy-agent  │                                           │
  ────────────────►  │   POST /screen                           │
  {agent_context,     │   {agent_context, incoming_content,      │
   incoming_content,  │    proposed_tool_call}                   │
   proposed_tool_call}│         │                                │
                     │         ▼                                 │
                     │   ┌───────────────┐                       │
                     │   │ Stage 1: Rule │  regex/keyword        │
                     │   │    Engine     │  signatures, <5ms      │
                     │   └───────┬───────┘                       │
                     │           ▼                                │
                     │   ┌───────────────┐   ┌──────────────────┐│
                     │   │ Stage 2: ML   │──►│ TurboQuant-       ││
                     │   │  Classifier   │◄──│ compressed vector ││
                     │   │  (similarity) │   │ index             ││
                     │   └───────┬───────┘   └──────────────────┘│
                     │           ▼                                │
                     │   ┌───────────────┐                       │
                     │   │ Stage 3: LLM- │  Groq API, only on    │
                     │   │    Judge      │  ambiguous cases       │
                     │   └───────┬───────┘                       │
                     │           ▼                                │
                     │   ┌───────────────┐   ┌──────────────────┐│
                     │   │ Verdict Fusion│◄──│  Policy Engine    ││
                     │   │ (risk_score)  │   │  (policy.yaml)    ││
                     │   └───────┬───────┘   └──────────────────┘│
                     │           ▼                                │
                     │   ┌───────────────┐                       │
                     │   │ Session/Audit │  SQLite               │
                     │   │     Store     │                       │
                     │   └───────┬───────┘                       │
                     │           ▼                                │
                     │   WebSocket/polling feed ──► React         │
                     │                              Dashboard      │
                     └─────────────────────────────────────────┘
```

## Component responsibilities

| Component | Responsibility |
|---|---|
| `/screen` endpoint | Accepts `{agent_context, incoming_content, proposed_tool_call}`; orchestrates the 3-stage cascade; returns the verdict object. See [API.md](API.md). |
| Rule Engine | Loads a signature list (regex/keyword) at startup; stateless, pure-function scoring. Near-zero cost, sub-5ms. |
| ML Classifier Service | Loads a local embedding model (sentence-transformers) once at boot; scores incoming text by similarity to known injection embeddings. |
| Vector Index (TurboQuant-compressed) | Stores the growing library of known injection/jailbreak/session embeddings in a quantized index (`pyturboquant`); queried by the ML Classifier Service instead of a raw in-memory array. Data-oblivious (no training/calibration needed), ~6x memory reduction, near-lossless similarity search — matters most once the signature library scales into the thousands of vectors (e.g. a future community-contributed pattern library). |
| LLM-Judge Client | Wraps the Groq API with a strict system prompt + JSON schema; only invoked when Stage 1/2 disagree or land in an ambiguous score band. |
| Policy Engine | Loads `policy.yaml` at startup; exposes `is_allowed(tool_name, requested_scope, context) -> (bool, reason)`. Independent of the injection score — a policy violation is a hard block regardless of `risk_score`. |
| Verdict Fusion | Combines rule score, ML score, and judge score into one bounded `risk_score` plus a human-readable explanation, using the weighted-sum formula in the project report, Chapter 11.3. |
| Session/Audit Store | SQLite (Postgres upgrade path) logging every screened call — powers the dashboard's live feed and the audit trail. |
| WebSocket/polling feed | Pushes new verdicts to the React dashboard in near-real-time. |

## Data flow summary

1. Agent-side client (SDK wrapper) intercepts a proposed tool call and any
   content the agent is about to act on.
2. It POSTs to `/screen`.
3. Rule Engine, ML Classifier (via the TurboQuant-backed vector index), and
   — if ambiguous — the LLM-Judge each produce a component score.
4. Verdict Fusion combines these into `risk_score`, independent of the
   Policy Engine's `is_allowed()` check on the proposed tool call itself.
5. The final verdict (`allow` / `block` / `require_approval`) is returned to
   the client, logged to the Session/Audit Store, and pushed to the
   dashboard feed.
6. The agent-side client enforces the verdict before letting the real tool
   call execute.

## Two distinct "clients"

- **Agent-side client** — a thin SDK/wrapper (Python function or
  LangChain/CrewAI tool-call interceptor) any agent developer drops in. This
  is the integration surface real users of Sentinel Layer touch.
- **Dashboard client** — a React/TypeScript SPA for the operator (or, in the
  hackathon demo, for the judges): live feed of screened calls, risk score,
  matched signal, policy rule, and allow/block/approve state, with a policy
  toggle for live editing.

## Non-goals (explicitly out of scope)

- Sentinel Layer is not a new foundation model and does not train or
  fine-tune an LLM from scratch.
- It does not attempt to secure the model weights or training pipeline —
  it operates entirely at the runtime/tool-call layer.
- It is not, at this stage, a multi-tenant hosted SaaS — the reference
  architecture is a single-tenant, self-hosted proxy.

## Deployment shape (Phase 0 baseline)

Single FastAPI service, containerised via `Dockerfile`, deployable to a
free-tier host (Render/Fly.io) or run locally with a tunnel (ngrok/
Cloudflare Tunnel) for the demo. See `RULE.md` Section E — every phase must
leave this deployable, not just "runnable on my machine."
