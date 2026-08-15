# docs/status.md — Living Project Snapshot

Rewritten (not appended) after every phase. This file alone should let a
new contributor or AI agent understand the entire project state in under a
minute — see `RULE.md` Section D.

## Built (100% Complete — All 10 Phases Delivered)
- Full governance documentation set (README, RULE, AGENT, COLLABORATION,
  ARCHITECTURE, PHASE, API, SECURITY, CONTRIBUTING, CHANGELOG)
- `docs/decisions.md` and `docs/status.md` (this file)
- Executive Pitch Deck & Presentation: `docs/PITCH_DECK.md`
- Complete Postman Collection: `docs/sentinel_api.postman_collection.json` (11 folders, all 4 roles)
- Repo scaffold: `backend/app/main.py` (FastAPI app + `/health` + `/screen` + `/demo` + `/events` + `/policy` + `/auth` + `/users` + `/tokens` + CORS), `backend/app/config.py`, `backend/requirements.txt`
- Pydantic v2 schemas: `backend/app/models.py` matching `API.md`
- `/screen` router: `backend/app/routers/screen.py` with Stage 0 Token Permission Enforcement, 3-stage Verdict Fusion, Hard Policy Enforcement, and Audit Logging
- Stage 1 Rule Engine: `backend/app/services/rule_engine.py` (18 threat signatures)
- Stage 2 ML Classifier & TurboQuant Vector Index: `backend/app/services/ml_classifier.py` (`all-MiniLM-L6-v2`), `backend/app/services/vector_index.py` (8-bit scalar quantization), `backend/app/data/injection_signatures.json` (25 seed attack vectors)
- Stage 3 LLM-Judge Layer: `backend/app/services/llm_judge.py` (Groq API `llama-3.1-8b-instant`, selective escalation logic, strict JSON prompt, resilient fallback)
- Hot Storage Database Layer: `backend/app/db/session.py` and `backend/app/db/models.py` (SQLite `sentinel.db` tracking `SessionCallCountDB`, `ScreenEventDB`, `UserDB`, `UserPermissionDB`, `AgentSessionDB`)
- Policy Engine: `backend/app/services/policy_engine.py` (declarative `policy.yaml` rules, path glob matching, domain whitelist validation, session call limits)
- Auth & RBAC Services: `backend/app/services/auth.py` and `backend/app/middleware/auth.py` (Google & GitHub OAuth, JWT dashboard tokens, 8-hour signed agent session tokens)
- User Management & Token APIs: `backend/app/routers/users.py`, `backend/app/routers/tokens.py`, `backend/app/scripts/seed_admin.py`
- Python Sentinel SDK: `sentinel_sdk/` (`SentinelGuard`, `SentinelBlocked`, and LangChain `SentinelToolWrapper`)
- Real-World PDF Injection Demo: `demos/pdf_injection/` (Poisoned invoice with hidden white text `[INST]` injection and runnable `demo_agent.py`)
- Enterprise Tool Registry: `backend/app/agent/tools.py` (7 tools: `read_email`, `write_file`, `call_http`, `send_email`, `execute_sql`, `bash_execute`, `search_web`)
- Toy Agent: `backend/app/agent/toy_agent.py` (`ToyAgent` with unprotected vs Sentinel protected mode)
- Staged Attack Scenarios: `backend/app/scenarios/attack_scenarios.py`
- React 18 + Vite Frontend (`frontend/`): `LoginPage.jsx` (Sentinel cyber aesthetics), `AdminPanel.jsx` (member management & live permission toggles), `SessionTokenPanel.jsx` (token generation & payload decoding), unified split-screen operations dashboard, live SSE stream, and policy manager
- Test suite: **55/55 tests passing** across `test_health.py` (2), `test_screen.py` (7), `test_rule_engine.py` (9), `test_ml_classifier.py` (4), `test_llm_judge.py` (5), `test_policy_engine.py` (7), `test_toy_agent.py` (6), `test_auth.py` (4), `test_users_and_tokens.py` (4), `test_screen_stage0.py` (3), and `test_sdk.py` (4)
- Frontend build: Vite production build succeeded transforming 35 modules with 0 errors.

## In progress
- None (All 10 phases complete and verified).

## Not started
- Future milestones: PostgreSQL cold storage exporter, eBPF kernel interception.
