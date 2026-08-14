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


### Phase 4 — LLM-judge — `phase-4-llm-judge` — ⬜ not started

**Scope:** Groq client, strict JSON schema, escalation-trigger logic
(Stage 1/2 confidence delta).

**Exit criteria:** Ambiguous cases correctly escalate and return valid
structured verdicts; documented fallback behaviour if Groq is unreachable.

### Phase 5 — Policy engine — `phase-5-policy-engine` — ⬜ not started

**Scope:** `policy.yaml` format + `is_allowed()` enforcement.

**Exit criteria:** Over-scope calls hard-blocked independent of
`risk_score`.

### Phase 6 — Toy agent — `phase-6-toy-agent` — ⬜ not started

**Scope:** LangChain/CrewAI agent, 2–3 tools, wired through the proxy.

**Exit criteria:** All 3 attack scenarios (direct injection, indirect
injection, over-scope call) reproducible on demand.

### Phase 7 — Dashboard — `phase-7-dashboard` — ⬜ not started

**Scope:** React/TypeScript dashboard, live feed, verdict detail view.

**Exit criteria:** Dashboard reflects live `/screen` calls with correct
risk score/signal/verdict.

### Phase 8 — Polish & demo — `phase-8-polish-demo` — ⬜ not started

**Scope:** Integration hardening, rehearsal, fallback recording, deck.

**Exit criteria:** Demo runs twice, end to end, without manual intervention.

---

## How to use this file

- Update the status emoji and checkboxes as work happens — this file should
  always reflect reality, same standard as `docs/status.md`.
- Never start a phase whose predecessor isn't ✅ without explicit sign-off
  logged in `docs/decisions.md` explaining why you're deviating from order.
- Full rationale for this sequencing is in the project report, Chapter 14.
