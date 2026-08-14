# docs/status.md — Living Project Snapshot

Rewritten (not appended) after every phase. This file alone should let a
new contributor or AI agent understand the entire project state in under a
minute — see `RULE.md` Section D.

## Built
- Full governance documentation set (README, RULE, AGENT, COLLABORATION,
  ARCHITECTURE, PHASE, API, SECURITY, CONTRIBUTING, CHANGELOG)
- `docs/decisions.md` and `docs/status.md` (this file)
- Repo scaffold: `backend/app/main.py` (FastAPI app + `/health` + `/screen`),
  `backend/app/config.py`, `backend/requirements.txt`
- Pydantic v2 schemas: `backend/app/models.py` matching `API.md`
- `/screen` router: `backend/app/routers/screen.py` with Verdict Fusion
- Stage 1 Rule Engine: `backend/app/services/rule_engine.py` (18 threat signatures)
- Stage 2 ML Classifier & TurboQuant Vector Index: `backend/app/services/ml_classifier.py` (`all-MiniLM-L6-v2`), `backend/app/services/vector_index.py` (8-bit scalar quantization), `backend/app/data/injection_signatures.json` (25 seed attack vectors)
- Test suite: 22/22 tests passing across `test_health.py` (2), `test_screen.py` (7), `test_rule_engine.py` (9), and `test_ml_classifier.py` (4)
- `.github/workflows/ci.yml` (installs deps, runs pytest)
- `Dockerfile`, `.env.example`, `.gitignore`, `LICENSE` (MIT)
- `policy/policy.example.yaml` (reference only, not yet enforced)

## In progress
- Phase 3 complete (awaiting review/merge to `main`). Next: Phase 4.

## Not started
- Phase 4: Groq-backed LLM-judge layer
- Phase 5: policy engine enforcement
- Phase 6: toy agent + staged attack scenarios
- Phase 7: React/TypeScript dashboard
- Phase 8: integration polish, demo rehearsal, pitch deck
