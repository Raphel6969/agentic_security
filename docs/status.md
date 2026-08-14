# docs/status.md — Living Project Snapshot

Rewritten (not appended) after every phase. This file alone should let a
new contributor or AI agent understand the entire project state in under a
minute — see `RULE.md` Section D.

## Built
- Full governance documentation set (README, RULE, AGENT, COLLABORATION,
  ARCHITECTURE, PHASE, API, SECURITY, CONTRIBUTING, CHANGELOG)
- `docs/decisions.md` and `docs/status.md` (this file)
- Repo scaffold: `backend/app/main.py` (FastAPI app + `/health`),
  `backend/app/config.py`, `backend/tests/test_health.py`,
  `backend/requirements.txt`
- `.github/workflows/ci.yml` (installs deps, runs pytest)
- `Dockerfile`, `.env.example`, `.gitignore`, `LICENSE` (MIT)
- `policy/policy.example.yaml` (reference only, not yet enforced)

## In progress
- Phase 0: scaffold verified locally (app boots, `/health` returns 200,
  2/2 tests pass) — awaiting human sign-off before opening Phase 1

## Not started
- Phase 1: real `/screen` request/response handling
- Phase 2: rule/heuristic detection engine
- Phase 3: ML classifier + TurboQuant-compressed vector index
- Phase 4: Groq-backed LLM-judge layer
- Phase 5: policy engine enforcement
- Phase 6: toy agent + staged attack scenarios
- Phase 7: React/TypeScript dashboard
- Phase 8: integration polish, demo rehearsal, pitch deck
