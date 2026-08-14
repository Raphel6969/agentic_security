# Sentinel Layer

> A runtime firewall for prompt-injection and agentic-AI risk. Sits between an
> AI agent and the tools/APIs it can call, screens every risky action in real
> time, and explains *why* — not just allow/block.

**Status:** Phase 0 — Setup &nbsp;·&nbsp; see [PHASE.md](PHASE.md) for the full roadmap and current progress.

---

## What this is

88% of enterprises running AI agents have already had an agent-related
security incident, and prompt-injection attacks grew ~340% year over year.
The products that catch this today (Zenity, Lakera, HiddenLayer, Cisco AI
Defense) are enterprise-priced and enterprise-integration-heavy. Sentinel
Layer is the explainable, self-serve version: a lightweight proxy any team
can drop into a LangChain/CrewAI agent, that screens incoming content and
proposed tool calls through a three-stage detection cascade, enforces a
declarative permission policy, and shows a live, human-readable audit trail
of what it caught and why.

Full problem/market/architecture rationale lives in the project report
(`Sentinel_Layer_Deep_Dive_Report.pdf`, 14 chapters) — this repo is the build.

## Documentation map

| Doc | What's in it |
|---|---|
| [RULE.md](RULE.md) | Non-negotiable phase discipline, branching, permission checkpoints, doc requirements — read this first if you're contributing |
| [AGENT.md](AGENT.md) | Context primer for AI coding agents working on this repo |
| [COLLABORATION.md](COLLABORATION.md) | How the human team works together — roles, cadence, decisions, reviews |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Full technical architecture, data flow, and component responsibilities |
| [API.md](API.md) | The `/screen` endpoint contract — request/response schema, examples, error codes |
| [PHASE.md](PHASE.md) | The living phase tracker — Phase 0 through 8, exit criteria, current status |
| [SECURITY.md](SECURITY.md) | Responsible disclosure policy and this repo's own security practices |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Dev environment setup, coding standards, commit/branch conventions |
| [CHANGELOG.md](CHANGELOG.md) | Notable changes, phase by phase |
| [docs/decisions.md](docs/decisions.md) | Running log of technical decisions and why they were made |
| [docs/status.md](docs/status.md) | Living snapshot: built / in progress / not started |

## Project structure

```
sentinel-layer/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, /health (Phase 0), /screen (Phase 1+)
│   │   └── config.py        # Settings/env loading
│   ├── tests/
│   │   └── test_health.py
│   └── requirements.txt
├── frontend/                 # React/TypeScript dashboard (Phase 7)
├── policy/
│   └── policy.example.yaml  # Example tool-scope policy (Phase 4)
├── docs/
│   ├── decisions.md
│   └── status.md
├── .github/workflows/ci.yml
├── Dockerfile
├── .env.example
└── (this file, RULE.md, AGENT.md, COLLABORATION.md, ARCHITECTURE.md, API.md, PHASE.md, SECURITY.md, CONTRIBUTING.md, CHANGELOG.md)
```

## Quickstart

```bash
git clone <repo-url> && cd sentinel-layer
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --reload --app-dir backend
curl http://localhost:8000/health
```

## Tech stack (summary — full detail in ARCHITECTURE.md)

FastAPI · sentence-transformers · TurboQuant (`pyturboquant`) · Groq API ·
SQLite · React/TypeScript · Docker. Full rationale for each choice is in
ARCHITECTURE.md and the project report, Chapter 6.

## License

MIT — see [LICENSE](LICENSE).

## Contributing

Read [RULE.md](RULE.md) and [CONTRIBUTING.md](CONTRIBUTING.md) before opening
any branch or PR. This project is built strictly phase by phase — see
[PHASE.md](PHASE.md) for what's in scope right now.
