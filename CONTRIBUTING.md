# CONTRIBUTING.md

Read [RULE.md](RULE.md) and [AGENT.md](AGENT.md) first — this file covers
the mechanics of getting set up and the coding conventions; RULE.md governs
process and is non-negotiable.

## Dev environment setup

```bash
git clone <repo-url> && cd sentinel-layer
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env   # fill in GROQ_API_KEY once Phase 4 needs it
uvicorn app.main:app --reload --app-dir backend
```

Run tests:
```bash
cd backend && pytest
```

## Branch naming

Exactly as declared in `PHASE.md` — e.g. `phase-2-rule-engine`. Do not
invent alternate names; if a phase needs sub-branches, use
`phase-2a-...` / `phase-2b-...` and log the split in `docs/decisions.md`
per `RULE.md` Section A.4.

## Commit message format

```
[phase-N] short imperative summary

- what changed
- why (1 line is enough)
```

## Coding standards

- Python: type-hint public functions, keep FastAPI route handlers thin
  (delegate to a service module), Pydantic models for every request/
  response shape (see `API.md`).
- Keep components small and swappable — e.g. the ML classifier should be
  callable behind one interface so the embedding model or the TurboQuant
  index can be swapped without touching `/screen`'s orchestration logic.
- Favour explainability over cleverness: if a scoring function can't
  produce a plain-language reason for its output, it's not done yet
  (matches the project's core design principle — report, Ch.6/9).

## Before opening a PR

- [ ] Exit criteria for this phase (`PHASE.md`) are met
- [ ] `docs/decisions.md` updated
- [ ] `docs/status.md` rewritten to reflect current state
- [ ] Tests pass locally
- [ ] You have explicit permission to open the PR (`RULE.md` Section C)

## Questions before you start

If anything about scope, architecture, or priority is unclear, ask before
writing code. This is a stated project rule, not a courtesy — see the
Guiding Principle at the top of `RULE.md`.
