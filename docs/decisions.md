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
