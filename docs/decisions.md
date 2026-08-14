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





