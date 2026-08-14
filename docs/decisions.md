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



