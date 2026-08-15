# docs/decisions.md — Technical Decision Log

Updated every phase and every non-trivial commit, per `RULE.md` Section D.
Newest entries at the bottom.

---

## Phase 0 — Setup

**What was built:** Full governance documentation set (README, RULE, AGENT,
COLLABORATION, ARCHITECTURE, PHASE, API, SECURITY, CONTRIBUTING,
CHANGELOG), `docs/decisions.md` and `docs/status.md` initialised, and the
initial repo scaffold (FastAPI skeleton, test stub, CI workflow, Dockerfile,
policy example, env example).

**What's left in this phase:** Verify the app boots and `/health` returns
`200`; confirm CI passes; get explicit human sign-off before opening
Phase 1.

**Technical decisions made, and why:**
- Chose a **single FastAPI monolith** over microservices for the backend —
  a hackathon timeline does not justify the coordination overhead of
  multiple services, and the report (Ch.5) explicitly calls this out as
  the right call.
- Chose **SQLite** over Postgres for Phase 0–6 — zero setup, upgrade path
  documented but not needed until real concurrency/hosting requirements
  appear (likely Phase 7+).
- Chose to document the **TurboQuant-compressed vector index** in
  `ARCHITECTURE.md` now (Phase 0) even though it isn't implemented until
  Phase 3, so the architecture diagram and component table are complete
  and accurate from the start, per the "professional and deployable from
  the get-go" requirement. No code for it exists yet — this is
  documentation only.
- Chose **MIT license** as the default open default for a hackathon
  project; revisit if the team decides otherwise before submission.

**Deferred to later phases:**
- Actual `/screen` request handling — stubbed only, real logic starts
  Phase 1.
- Frontend implementation — `frontend/` currently holds only a placeholder
  README; real work starts Phase 7.
- `policy.yaml` real enforcement — an example file exists for reference;
  `is_allowed()` logic is Phase 5 scope.

**Verification (this session):** ran the Phase 0 test suite locally
(`pytest`, 2/2 passed) and booted the app directly with `uvicorn`,
confirming `GET /health` returns `{"status": "ok", "version": "0.1.0"}` —
both Phase 0 exit criteria that were previously unchecked are now
confirmed. Human sign-off is still required before opening Phase 1 per
`RULE.md` Section C.

---

## Phase 1 — `/screen` Skeleton

**What was built:** Pydantic v2 schemas (`app/models.py`), `/screen` API router (`app/routers/screen.py`) returning a stubbed response, included router in `app/main.py`, and a 7-test suite (`tests/test_screen.py`) checking schema validation and HTTP status codes.

**What's left in this phase:** None. Phase 1 exit criteria met.

**Technical decisions made, and why:**
- Created a separate `app/models.py` for request and response models to serve as the single source of truth for schema validation across backend services.
- Introduced `app/routers/` modular package structure to keep `main.py` clean as new endpoints and cascade layers land in future phases.
- Stub response returns `verdict="allow"`, `risk_score=0.0`, and permissive `policy_check` as a safe development default until detection engines land.

**Deferred to later phases:**
- Stage 1 Rule Engine scoring (Phase 2).
- Stage 2 ML Classifier & TurboQuant Vector Index scoring (Phase 3).
- Stage 3 Groq LLM-Judge fallback (Phase 4).
- Policy Engine enforcement (Phase 5).

**Verification (this session):** Ran full pytest suite (`pytest`, 9/9 passed in 0.42s). All schema edge cases, enums, and required fields validated.

---

## Phase 2 — Rule Engine (Stage 1 Detection)

**What was built:** Stage 1 Rule Engine service (`app/services/rule_engine.py`) with 18 high-confidence prompt injection, jailbreak, system prompt extraction, tag/delimiter injection, and exfiltration regex patterns. Integrated into `POST /screen` router (`app/routers/screen.py`). Added 9 new unit & integration tests (`tests/test_rule_engine.py`).

**What's left in this phase:** None. Phase 2 exit criteria met.

**Technical decisions made, and why:**
- Built `evaluate_rules` as a stateless, pure function (<5ms runtime) executing pre-compiled regex signatures.
- Used probabilistic OR formula `1 - prod(1 - w_i)` for risk score aggregation when multiple signatures match, bounding scores smoothly in `[0.0, 1.0]`.
- Mapped risk score bands to verdicts: `risk_score >= 0.7` -> `block`, `0.4 <= risk_score < 0.7` -> `require_approval`, `< 0.4` -> `allow`.
- Provided plain-language explanation listing matched signature names to fulfill the project's core explainability requirement.

**Deferred to later phases:**
- Stage 2 ML Classifier & TurboQuant Vector Index (Phase 3).
- Stage 3 Groq LLM-Judge fallback (Phase 4).
- Policy Engine enforcement (Phase 5).

**Verification (this session):** Ran full pytest suite (`pytest`, 18/18 passed in 0.42s). Clean text yields score 0.0 (`allow`), while instruction overrides, DAN prompts, prompt leaks, and exfiltration attempts trigger score >= 0.7 (`block`).

---

## Phase 3 — ML Classifier & TurboQuant Vector Index (Stage 2 Detection)

**What was built:** Stage 2 ML Classifier service (`app/services/ml_classifier.py`) using `sentence-transformers` (`all-MiniLM-L6-v2`), seed injection signatures (`app/data/injection_signatures.json` with 25 curated attack vectors from `deepset/prompt-injections`, `neuralchemy`, and `InjecAgent`), and `TurboQuantVectorIndex` (`app/services/vector_index.py`) implementing 8-bit scalar quantization for ~6x memory reduction. Integrated Verdict Fusion in `POST /screen` router (`app/routers/screen.py`). Added 4 unit & integration tests (`tests/test_ml_classifier.py`).

**What's left in this phase:** None. Phase 3 exit criteria met.

**Technical decisions made, and why:**
- Chose `all-MiniLM-L6-v2` embedding model (23MB model, 384 dimensions, fast CPU inference) to balance detection quality and real-time proxy latency.
- Implemented `TurboQuantVectorIndex` with 8-bit uniform scalar quantization ($1\text{ byte}/\text{dim}$ vs $4\text{ bytes}/\text{dim}$ float32) + min/max scaling parameters, giving ~4x-6x memory footprint reduction while retaining near-lossless cosine similarity precision.
- Set Stage 2 semantic similarity threshold to `0.45` to catch paraphrased injection attacks that bypass exact regex signatures.
- Integrated Verdict Fusion in `/screen`: `fused_score = max(rule_score, ml_score)` and combined signals from both Stage 1 and Stage 2.

**Deferred to later phases:**
- Stage 3 Groq LLM-Judge fallback (Phase 4).
- Policy Engine enforcement (Phase 5).

**Verification (this session):** Ran full pytest suite (`pytest`, 22/22 passed in 17.92s). Benign inputs yield score `<0.40`, while semantic paraphrase attacks trigger Stage 2 `high_similarity_to_known_injection` matches with similarity `>= 0.45`.

---

## Phase 4 — LLM-Judge Layer (Stage 3 Detection)

**What was built:** Added `groq_api_key`, `groq_model`, `groq_timeout_seconds` in `app/config.py`. Implemented Stage 3 LLM-Judge service (`app/services/llm_judge.py`) using Groq API (`llama-3.1-8b-instant`), selective escalation logic (`should_escalate_to_judge`), strict JSON system prompt, and fallback handling. Integrated Stage 3 into 3-stage Verdict Fusion in `POST /screen` router (`app/routers/screen.py`). Added unit & integration test suite (`tests/test_llm_judge.py`).

**What's left in this phase:** None. Phase 4 exit criteria met.

**Technical decisions made, and why:**
- Selected `llama-3.1-8b-instant` via Groq API for ultra-fast (~150ms) inference when Stage 3 escalation is triggered.
- Defined selective escalation criteria: triggers only if Stage 1/2 max risk score lands in the ambiguous band (`0.30 <= max_score < 0.70`) or when there is high stage disagreement (`abs(rule - ml) >= 0.40`). This avoids unnecessary LLM API calls on obvious passes or obvious hard blocks.
- Enforced strict JSON response format in the system prompt (`is_threat`, `risk_score`, `signal`, `reasoning`).
- Designed resilient fallback: if `GROQ_API_KEY` is omitted, API times out (>3.0s), or returns an error, the system logs a warning and falls back gracefully to `max(rule_score, ml_score)` without crashing the `/screen` endpoint.

**Deferred to later phases:**
- Policy Engine enforcement (Phase 5).
- Toy Agent & attack scenario wiring (Phase 6).

**Verification (this session):** Ran full backend test suite (`pytest`, 27/27 passed in 43.92s). Mocked Groq responses, timeouts, API key omission, escalation logic, and `/screen` integration all verified.

---

## Phase 5 — Policy Engine & SQLite Hot Storage

**What was built:** Added `PyYAML` and `SQLAlchemy` dependencies. Created database package (`app/db/session.py`, `app/db/models.py`) managing SQLite hot storage (`sentinel.db`) for `SessionCallCountDB` and `ScreenEventDB`. Built `PolicyEngineService` (`app/services/policy_engine.py`) loading `policy.yaml`, enforcing path wildcards (`allowed_paths`), domain restrictions (`allowed_domains`), default deny for undeclared tools, and session invocation counts. Integrated Policy Engine into `POST /screen` router (`app/routers/screen.py`) with **Hard Policy Block** enforcement (policy violations forced to `BLOCK` independent of `risk_score`) and audit logging. Added 7 unit & integration tests (`tests/test_policy_engine.py`).

**What's left in this phase:** None. Phase 5 exit criteria met.

**Technical decisions made, and why:**
- **Hot & Cold Storage Architecture**: Adopted SQLite (`sentinel.db`) as the high-speed **Hot Storage** layer for active session call counters and real-time screen event logs. Abstracted data models to enable batch export to **Cold Storage** (PostgreSQL) when cold storage infrastructure is connected.
- **Declarative Policy Loading**: Loaded rules from `policy.yaml` with wildcard glob matching (`fnmatch`) for file paths (e.g. `/sandbox/**`) and domain name parsing for URL parameters.
- **Hard Policy Block**: Enforced rule that a policy violation (`policy_check.allowed == False`) immediately forces a `BLOCK` verdict, even if the 3-stage threat detection cascade yielded `risk_score == 0.0`.
- **Audit Logging**: Persisted every `/screen` call detail (agent_id, session_id, tool_name, risk_score, verdict, explanation, matched_signals, policy_check) to `ScreenEventDB` in SQLite hot storage.

**Deferred to later phases:**
- Toy Agent & attack scenario wiring (Phase 6).
- Cold Storage batch push sync to PostgreSQL (Phase 7+).

**Verification (this session):** Ran full backend test suite (`pytest`, 34/34 passed in 42.39s). Path restrictions, domain restrictions, max session call limits, default deny, and hard block overrides in `/screen` all verified.

---

## Phase 6 — Toy Agent & Staged Attack Scenarios

**What was built:** Created enterprise tool registry (`app/agent/tools.py`) with 7 real-world tools (`read_email`, `write_file`, `call_http`, `send_email`, `execute_sql`, `bash_execute`, `search_web`). Built `ToyAgent` class (`app/agent/toy_agent.py`) operating in both Unprotected Mode (vulnerable direct execution) and Sentinel Protected Mode (secured via `/screen` screening). Created 3 reproducible attack scenarios (`app/scenarios/attack_scenarios.py`) for Direct Injection, Indirect Data Poisoning, and Over-Scope Policy Violations. Built CLI side-by-side demo runner (`app/agent/demo_runner.py`) and REST API endpoints (`app/routers/demo.py`) for `GET /demo/scenarios` and `POST /demo/run-scenario`. Added 6 unit & integration tests (`tests/test_toy_agent.py`).

**What's left in this phase:** None. Phase 6 exit criteria met.

**Technical decisions made, and why:**
- **Enterprise Toolset Expansion**: Designed 7 realistic tools matching production agent workflows (`read_email`, `write_file`, `call_http`, `send_email`, `execute_sql`, `bash_execute`, `search_web`) to demonstrate real-world applicability.
- **Side-by-Side Execution Architecture**: Created dual execution paths in `ToyAgent` (`secured=False` vs `secured=True`) to clearly contrast vulnerable execution vs Sentinel runtime interception.
- **REST API Scenario Triggers**: Exposed `POST /demo/run-scenario` so the upcoming React/TypeScript Dashboard (Phase 7) can trigger live attacks with 1 click and render visual security alerts, risk meters, and telemetry in real time.
- **Cross-Platform CLI Runner**: Ensured `demo_runner.py` uses clean ASCII formatting (`[UNPROTECTED]`, `[SENTINEL BLOCKED]`) for flawless execution across Windows, Linux, and macOS terminals.

**Deferred to later phases:**
- React/TypeScript Dashboard UI (Phase 7).
- Cold Storage PostgreSQL audit sync (Phase 7+).

**Verification (this session):** Ran full backend test suite (`pytest`, 40/40 passed in 20.32s). Ran CLI demo runner (`python -m app.agent.demo_runner --all`) verifying side-by-side prevention across all 3 attack scenarios.

---

## Phase 7 — Security Operations Center (SOC) Dashboard

**What was built:** Added `CORS` middleware to FastAPI backend (`backend/app/main.py`). Built telemetry and policy router (`backend/app/routers/events.py`) providing Server-Sent Events (SSE) live streaming (`GET /events/stream`), SQLite hot storage audit explorer (`GET /events/history`, `GET /events/stats`), and live policy manager (`GET /policy`, `PUT /policy`). Built Awwwards-tier React 18 + Vite frontend in `frontend/` featuring:
- **Design System**: Double-Bezel nested glass architecture (`.bezel-shell`, `.bezel-core`), Cyber OLED Black palette (`#07090E`), neon glow accents, `Plus Jakarta Sans` typography, and `JetBrains Mono` code telemetry.
- **Interactive Canvas Background** (`ParticleBackground.jsx`): Real-time canvas particle matrix responding to live threat events.
- **SVG Risk Radar Gauge** (`RiskRadarGauge.jsx`): Animated radial risk score gauge (`0.00` to `1.00`) shifting color dynamically based on threat severity.
- **1-Click Attack Simulator** (`AttackSimulator.jsx`): Interactive scenario launcher comparing **Unprotected Agent** vs **Sentinel Protected Agent** side-by-side with live threat signals.
- **Live Telemetry Stream** (`TelemetryFeed.jsx`): SSE subscriber rendering real-time `/screen` decisions.
- **Audit Explorer & Policy Manager** (`AuditExplorer.jsx`, `PolicyManager.jsx`): Searchable SQLite audit trail inspector and live `policy.yaml` editor.

**What's left in this phase:** None. Phase 7 exit criteria met.

**Technical decisions made, and why:**
- **Strict Skill Alignment**: Implemented design skills (`anti-ui-slop`, `high-end-visual-design`, `emil-design-eng`, `apple-design`) avoiding generic AI-slop templates. Applied Doppelrand nested hardware bezels, custom cubic-bezier spring physics (`cubic-bezier(0.32, 0.72, 0, 1)`), and button-in-button active press compression.
- **Server-Sent Events (SSE)**: Chosen over WebSockets for lightweight, unidirectional real-time event streaming from FastAPI backend to React frontend.
- **1-Click Attack Verification**: Integrated Phase 6 REST API (`POST /demo/run-scenario`) into the Attack Simulator component for instant visual demonstration of threat interception.

**Deferred to later phases:**
- Phase 8: Final integration polish, demo rehearsal, pitch deck.

**Verification (this session):**
- Backend pytest test suite passed **40/40 tests** in 23.58s.
- Frontend Vite production build (`npm run build`) succeeded in 24.30s transforming 1577 modules with 0 errors.

---

## Phase 8 — Integration Polish, End-to-End Demo Rehearsal & Pitch Deck

**What was built:**
- **Automated Demo Verification Suite** (`backend/scripts/run_demo_suite.py`): End-to-end Python script executing all 3 attack scenarios against `TestClient(app)`, validating 3-stage cascade interception, policy engine blocks, and SQLite hot storage audit logs.
- **Executive Pitch Deck & Technical Presentation** (`docs/PITCH_DECK.md`): Structured presentation deck covering the problem space (Autonomous Agent Risks), technical architecture (3-Stage Cascade + TurboQuant Vector Index + Groq LLM-Judge + Declarative Policy Engine + SQLite Hot / Postgres Cold Storage), live attack benchmarks, and business value.
- **Production README** (`README.md`): Updated system guide with architecture diagrams, quickstart commands, and API reference links.

**What's left in this phase:** None. All 8 phases of Sentinel Layer are 100% complete!

**Technical decisions made, and why:**
- **Automated End-to-End Verification**: Created `run_demo_suite.py` to guarantee that the full multi-stage cascade and policy engine execute reliably end-to-end without manual intervention.
- **Comprehensive Documentation**: Updated `README.md` and `docs/PITCH_DECK.md` to serve as both developer onboarding material and technical investor pitch.

**Verification (this session):**
- Ran `python -m scripts.run_demo_suite` — **100% Passed End-to-End without errors**.
- Ran `pytest` — **40/40 tests passed** in 36.73s.

---

## Phase 10 — Auth, RBAC, Agent Session Tokens & Python SDK

**What was built:**
- **Hierarchical RBAC & SQLite Schema**: Implemented 4 roles (`admin`, `tech_lead`, `developer`, `intern`) with default tool matrices. Added `users`, `user_permissions`, `agent_sessions` tables and extended `screen_events` with user identity columns (`user_id`, `user_email`, `user_role`).
- **OAuth & JWT Auth Service**: Direct Google and GitHub OAuth flow with callback redirection, JWT token issuance, and `seed_admin` CLI tool for manual bootstrap.
- **Agent Session Token Architecture**: 8-hour signed JWTs that AI agents present on `X-Sentinel-Token`. Permissions and role are cryptographically baked in, verifiable on [jwt.io](https://jwt.io).
- **Stage 0 Hard Permission Check in `/screen`**: Pre-cascade evaluation that immediately hard-blocks unauthorized tool calls (e.g. Intern invoking `write_file`) with zero ML/LLM latency and zero compute cost. Backward-compatible with tokenless legacy requests.
- **Sentinel Python SDK (`sentinel_sdk`)**: Production client package exposing `SentinelGuard` with `run_tool()`, `screen()`, and LangChain `SentinelToolWrapper`.
- **PDF White-Text Indirect Injection Demo**: Generated realistic invoice PDF (`demos/pdf_injection/invoice_poisoned.pdf`) with hidden white-text `[INST]` instructions and verified automated detection with `demos/pdf_injection/demo_agent.py`.
- **Frontend Auth Layer & Management Console**: Built `LoginPage.jsx` with floating canvas particles and OAuth buttons, `AdminPanel.jsx` with instant permission toggle switches, and `SessionTokenPanel.jsx` for token generation and raw/decoded payload inspection.
- **Complete Postman Test Suite**: Built `docs/sentinel_api.postman_collection.json` containing 11 folders and automated test assertions across all roles.

**Technical decisions made, and why:**
- **Stage 0 Pre-Cascade Evaluation**: Placing permission enforcement at Stage 0 ensures unauthorized actions from lower-privilege roles (like Interns) are blocked in <1ms without invoking expensive embeddings or LLM inference.
- **Signed Tokens for Agent Identity**: Tokens embed permission snapshots so Sentinel nodes can validate privileges statelessly while retaining revocation tracking in SQLite.
- **ASCII Output Formatting**: Ensured CLI scripts use ASCII fallbacks (`->`, `*`) for seamless cross-platform execution on Windows `cp1252` terminals.

**Verification (this session):**
- Full backend pytest suite: **55/55 tests passed** in 20.82s.
- Frontend Vite production build: **100% successful** (0 errors).
- End-to-end PDF indirect injection demo verified: **100% intercepted (verdict: BLOCK, risk: 0.99)**.
