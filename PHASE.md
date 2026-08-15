# PHASE.md — Living Phase Tracker

This is the canonical phase breakdown referenced by `RULE.md` and
`AGENT.md`. Each phase gets its own Git branch, is scoped tightly, and ends
with a documentation update (`docs/decisions.md`, `docs/status.md`) plus
explicit human sign-off before the next phase begins.

**Legend:** ⬜ not started · 🟨 in progress · ✅ complete

---

### Phase 0 — Setup — `phase-0-setup` — ✅ complete

**Scope:** Repo scaffold, all governance docs (this set), empty FastAPI app,
CI stub, Dockerfile, license, `.gitignore`.

**Exit criteria:**
- [x] All governance docs present (README, RULE, AGENT, COLLABORATION,
      ARCHITECTURE, PHASE, API, SECURITY, CONTRIBUTING, CHANGELOG)
- [x] `docs/decisions.md` and `docs/status.md` initialised
- [x] App boots locally
- [x] `/health` endpoint returns `200`
- [x] CI configured to run pytest on every PR (verified locally: 2/2 tests pass)
- [x] Human lead has reviewed and approved the scaffold before Phase 1 begins

### Phase 1 — `/screen` skeleton — `phase-1-screen-endpoint` — ✅ complete

**Scope:** `/screen` endpoint with full Pydantic request/response schema
(per `API.md`), returning a stubbed verdict.

**Exit criteria:**
- [x] Endpoint accepts the full request shape and returns a well-formed (stubbed) response matching `API.md` exactly.
- [x] Full Pydantic v2 schemas defined in `app/models.py`.
- [x] Router included in FastAPI app (`app/main.py`).
- [x] Unit test suite (`tests/test_screen.py`) passing (7 tests).


### Phase 2 — Rule engine — `phase-2-rule-engine` — ✅ complete

**Scope:** Signature list + regex/keyword scoring, wired into `/screen`.

**Exit criteria:**
- [x] 18 high-confidence prompt injection and jailbreak signatures implemented in `app/services/rule_engine.py`.
- [x] Fast (<5ms) stateless scanner with probabilistic score accumulation.
- [x] Integrated into `POST /screen` router (`app/routers/screen.py`).
- [x] Unit and integration test suite (`tests/test_rule_engine.py`) passing (9 tests, 18/18 total).


### Phase 3 — ML classifier — `phase-3-ml-classifier` — ✅ complete

**Scope:** Embedding model + similarity scoring layer, backed by a
TurboQuant-compressed vector index (`ARCHITECTURE.md`).

**Exit criteria:**
- [x] Dense embedding model (`all-MiniLM-L6-v2`) integrated in `app/services/ml_classifier.py`.
- [x] TurboQuant 8-bit scalar quantized vector index implemented in `app/services/vector_index.py` (~6x memory reduction).
- [x] Seed dataset of 25 attack vectors (`app/data/injection_signatures.json`) from `deepset`, `neuralchemy`, and `InjecAgent`.
- [x] Wired into Verdict Fusion in `POST /screen` router (`app/routers/screen.py`).
- [x] Test suite (`tests/test_ml_classifier.py`) passing (4 tests, 22/22 total).


### Phase 4 — LLM-judge — `phase-4-llm-judge` — ✅ complete

**Scope:** Groq client, strict JSON schema, escalation-trigger logic
(Stage 1/2 confidence delta).

**Exit criteria:**
- [x] Groq LLM-Judge service implemented in `app/services/llm_judge.py` using `llama-3.1-8b-instant`.
- [x] Selective escalation trigger (`should_escalate_to_judge`) implemented (ambiguous band `0.30 <= max_score < 0.70` or stage delta `>= 0.40`).
- [x] Resilient fallback behaviour documented & implemented (falls back to Stage 1/2 score if `GROQ_API_KEY` missing or API times out).
- [x] Integrated into 3-stage Verdict Fusion in `POST /screen` router (`app/routers/screen.py`).
- [x] Unit and integration test suite (`tests/test_llm_judge.py`) passing (5 tests, 27/27 total).


### Phase 5 — Policy engine — `phase-5-policy-engine` — ✅ complete

**Scope:** `policy.yaml` format + `evaluate_policy()` enforcement + SQLite Hot Storage.

**Exit criteria:**
- [x] Policy Engine service implemented in `app/services/policy_engine.py` loading `policy.yaml`.
- [x] SQLite Hot Storage layer (`app/db/session.py`, `app/db/models.py`) implemented for active session call counters and real-time screen event logs (`ScreenEventDB`).
- [x] Path restrictions (`allowed_paths`), domain restrictions (`allowed_domains`), default deny, and max session call limits enforced.
- [x] Hard Policy Block integrated into `POST /screen` router (`app/routers/screen.py`) forcing `verdict = "block"` independent of `risk_score`.
- [x] Unit and integration test suite (`tests/test_policy_engine.py`) passing (7 tests, 34/34 total).


### Phase 6 — Toy agent — `phase-6-toy-agent` — ✅ complete

**Scope:** Toy Agent + 7 real-world enterprise tools + 3 staged attack scenarios.

**Exit criteria:**
- [x] Real-world tool registry implemented in `app/agent/tools.py` (7 tools: `read_email`, `write_file`, `call_http`, `send_email`, `execute_sql`, `bash_execute`, `search_web`).
- [x] `ToyAgent` implemented in `app/agent/toy_agent.py` supporting both Unprotected Mode (vulnerable direct execution) and Sentinel Protected Mode (secured via `/screen`).
- [x] 3 reproducible attack scenarios implemented in `app/scenarios/attack_scenarios.py` (Direct Injection, Indirect Data Poisoning, Over-Scope Call).
- [x] Side-by-side CLI demo runner (`app/agent/demo_runner.py`) created.
- [x] Scenario REST API endpoints (`GET /demo/scenarios`, `POST /demo/run-scenario`) implemented in `app/routers/demo.py` for Phase 7 Dashboard integration.
- [x] Unit and integration test suite (`tests/test_toy_agent.py`) passing (6 tests, 40/40 total).


### Phase 7 — Dashboard — `phase-7-dashboard` — ✅ complete

**Scope:** React 18 + Vite Security Operations Center (SOC) Control Room + Telemetry Stream + Policy Editor.

**Exit criteria:**
- [x] CORS middleware enabled in `backend/app/main.py`.
- [x] Server-Sent Events (SSE) telemetry stream (`GET /events/stream`), audit history (`GET /events/history`), and policy endpoints (`GET /policy`, `PUT /policy`) built in `backend/app/routers/events.py`.
- [x] React 18 + Vite frontend SPA (`frontend/`) initialized adhering strictly to design skills (`anti-ui-slop`, `high-end-visual-design`, `emil-design-eng`, `apple-design`).
- [x] Double-Bezel glass architecture (`.bezel-shell`, `.bezel-core`), HTML5 Canvas particle background (`ParticleBackground.jsx`), and SVG radial risk radar gauge (`RiskRadarGauge.jsx`) implemented.
- [x] 1-Click Interactive Attack Simulator (`AttackSimulator.jsx`) built, comparing Unprotected vs Sentinel Protected Agent side-by-side.
- [x] Live SSE telemetry stream (`TelemetryFeed.jsx`), SQLite Hot Storage Audit Explorer (`AuditExplorer.jsx`), and Policy Manager (`PolicyManager.jsx`) implemented.
- [x] Vite production build (`npm run build`) succeeded transforming 1577 modules in 24.30s.
- [x] Backend pytest test suite (`pytest`) passing 40/40 tests.


### Phase 8 — Polish & demo — `phase-8-polish-demo` — ✅ complete

**Scope:** Integration hardening, end-to-end demo rehearsal, README updating, pitch deck creation.

**Exit criteria:**
- [x] Automated end-to-end demo suite script (`backend/scripts/run_demo_suite.py`) created.
- [x] Demo suite executed 100% cleanly end-to-end without manual intervention.
- [x] Executive pitch deck & technical presentation created in `docs/PITCH_DECK.md`.
- [x] Production `README.md` updated with architecture diagrams, quickstart instructions, and test commands.
- [x] Full backend test suite (`pytest`) passing 40/40 tests.
- [x] All 8 phases completed, documented, and verified.


### Phase 9 — Continuous Simulation & Unified Split-Screen — `phase-9-simulation` — ✅ complete

**Scope:** Real-time continuous simulation backend, pre-seeded DB state, unified split-screen live operations dashboard.

**Exit criteria:**
- [x] Added `POST /demo/seed` pre-populating realistic threat history in SQLite.
- [x] Added background continuous agent simulation (`POST /demo/continuous`, `POST /demo/continuous/stop`).
- [x] Unified frontend layout in `App.jsx` combining live telemetry stream alongside interactive agent controls.


### Phase 10 — Auth, RBAC, Agent Session Tokens & SDK — `phase-10-auth` — ✅ complete

**Scope:** 4-Role Hierarchical RBAC (Admin, Tech Lead, Developer, Intern), Google/GitHub OAuth, Signed 8-Hour Agent Session Tokens, Stage 0 Permission Enforcement in `/screen`, Python SDK (`sentinel_sdk`), and PDF White-Text Indirect Injection Demo.

**Exit criteria:**
- [x] Extended SQLite schema with `users`, `user_permissions`, `agent_sessions` tables and added nullable `user_id`, `user_email`, `user_role` to `screen_events`.
- [x] JWT Auth service (`app/services/auth.py`), middleware dependencies (`app/middleware/auth.py`), and OAuth routers (`app/routers/auth.py`).
- [x] Admin-only user management API (`app/routers/users.py`) for inviting members and toggling per-user tool permissions.
- [x] Agent Session Token API (`app/routers/tokens.py`) issuing signed 8-hour JWTs with permission snapshots.
- [x] Stage 0 Token Permission Check in `app/routers/screen.py` blocking unauthorized tool invocations instantly before cascade execution.
- [x] Python SDK (`sentinel_sdk/`) with `SentinelGuard` and LangChain `SentinelToolWrapper`.
- [x] Poisoned invoice PDF and end-to-end runnable script (`demos/pdf_injection/demo_agent.py`) demonstrating detection of hidden white-text injections.
- [x] React frontend auth layer with Sentinel-branded `LoginPage.jsx`, `AdminPanel.jsx`, and `SessionTokenPanel.jsx`.
- [x] Complete Postman collection (`docs/sentinel_api.postman_collection.json`) covering all roles, safe/blocked scenarios, and telemetry.
- [x] Full backend test suite (`pytest`) passing 55/55 tests and Vite production build succeeding with 0 errors.

---

## How to use this file

- Update the status emoji and checkboxes as work happens — this file should
  always reflect reality, same standard as `docs/status.md`.
- Never start a phase whose predecessor isn't ✅ without explicit sign-off
  logged in `docs/decisions.md` explaining why you're deviating from order.
- Full rationale for this sequencing is in the project report, Chapter 14.
