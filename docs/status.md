# docs/status.md — Living Project Snapshot

Rewritten (not appended) after every phase. This file alone should let a
new contributor or AI agent understand the entire project state in under a
minute — see `RULE.md` Section D.

## Built
- Full governance documentation set (README, RULE, AGENT, COLLABORATION,
  ARCHITECTURE, PHASE, API, SECURITY, CONTRIBUTING, CHANGELOG)
- `docs/decisions.md` and `docs/status.md` (this file)
- Repo scaffold: `backend/app/main.py` (FastAPI app + `/health` + `/screen` + `/demo` + `/events` + `/policy` + CORS),
  `backend/app/config.py`, `backend/requirements.txt`
- Pydantic v2 schemas: `backend/app/models.py` matching `API.md`
- `/screen` router: `backend/app/routers/screen.py` with 3-stage Verdict Fusion, Hard Policy Enforcement, and Audit Logging
- Stage 1 Rule Engine: `backend/app/services/rule_engine.py` (18 threat signatures)
- Stage 2 ML Classifier & TurboQuant Vector Index: `backend/app/services/ml_classifier.py` (`all-MiniLM-L6-v2`), `backend/app/services/vector_index.py` (8-bit scalar quantization), `backend/app/data/injection_signatures.json` (25 seed attack vectors)
- Stage 3 LLM-Judge Layer: `backend/app/services/llm_judge.py` (Groq API `llama-3.1-8b-instant`, selective escalation logic, strict JSON prompt, resilient fallback)
- Hot Storage Database Layer: `backend/app/db/session.py` and `backend/app/db/models.py` (SQLite `sentinel.db` tracking `SessionCallCountDB` and `ScreenEventDB`, prepared for cold storage Postgres batch export)
- Policy Engine: `backend/app/services/policy_engine.py` (declarative `policy.yaml` rules, path glob matching, domain whitelist validation, session call limits)
- Enterprise Tool Registry: `backend/app/agent/tools.py` (7 real-world tools: `read_email`, `write_file`, `call_http`, `send_email`, `execute_sql`, `bash_execute`, `search_web`)
- Toy Agent: `backend/app/agent/toy_agent.py` (`ToyAgent` with `secured=False` unprotected mode vs `secured=True` Sentinel protected mode)
- Staged Attack Scenarios: `backend/app/scenarios/attack_scenarios.py` (Direct Injection, Indirect Data Poisoning, Over-Scope Policy Block)
- CLI Demo Runner: `backend/app/agent/demo_runner.py` (side-by-side terminal demonstration)
- Scenario REST API: `backend/app/routers/demo.py` (`GET /demo/scenarios` and `POST /demo/run-scenario`)
- Telemetry & Policy Router: `backend/app/routers/events.py` (`GET /events/stream`, `GET /events/history`, `GET /events/stats`, `GET /policy`, `PUT /policy`)
- React 18 + Vite SOC Control Room (`frontend/`): Double-bezel glass design, interactive canvas background, radial risk radar gauge, 1-click attack simulator, SSE live stream feed, SQLite audit log explorer, and live policy editor
- Test suite: 40/40 tests passing across `test_health.py` (2), `test_screen.py` (7), `test_rule_engine.py` (9), `test_ml_classifier.py` (4), `test_llm_judge.py` (5), `test_policy_engine.py` (7), and `test_toy_agent.py` (6)
- `.github/workflows/ci.yml` (installs deps, runs pytest)
- `Dockerfile`, `.env.example`, `.gitignore`, `LICENSE` (MIT)
- `policy/policy.example.yaml` (declarative policy rules)

## In progress
- Phase 7 complete (awaiting review/merge to `main`). Next: Phase 8.

## Not started
- Phase 8: integration polish, demo rehearsal, pitch deck
