# AGENT.md — Context Primer for AI Coding Agents

If you are an AI agent (Claude Code or otherwise) about to work on this
repository, read this file first, then [RULE.md](RULE.md), then
[PHASE.md](PHASE.md) and [docs/status.md](docs/status.md). **Do not write or
change any code before doing so.**

## 60-second context

- **Project:** Sentinel Layer — a runtime firewall that screens an AI agent's
  incoming content and proposed tool calls for prompt injection/jailbreak
  attempts, enforces a declarative permission policy, and explains every
  verdict in plain language.
- **Current phase:** see [PHASE.md](PHASE.md) and
  [docs/status.md](docs/status.md) — `status.md` is the single source of
  truth for "what exists right now," always more current than your training
  data or any prior conversation summary.
- **Governing rules:** [RULE.md](RULE.md) — phase discipline, branching,
  permission checkpoints, documentation requirements. Non-negotiable.
- **Architecture reference:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **API contract:** [API.md](API.md)
- **Team norms:** [COLLABORATION.md](COLLABORATION.md)

## Before you write any code

1. Read `docs/status.md` — what's built, in progress, not started.
2. Read `docs/decisions.md` — why past choices were made, so you don't
   silently reverse or contradict them.
3. Confirm with the human lead which phase you're starting or continuing,
   and get an explicit go-ahead (`RULE.md` Section C). Do not assume
   "continue" means "proceed without checking in."
4. Create or check out the correct phase branch — **never work directly on
   `main`.**

## How to behave in this repo

- One phase at a time, strictly scoped (`RULE.md` Section A). If you notice
  something a later phase needs, log it in `docs/decisions.md` instead of
  building it now.
- Small, frequent, clearly labelled commits (`RULE.md` Section B) — commit
  and push time to time through the phase, not in one dump at the end.
- Ask before pushing, merging, or starting a new phase — every time, no
  exceptions, regardless of how small the change feels.
- Update `docs/decisions.md` and `docs/status.md` before considering any
  chunk of work "done."
- If an instruction is ambiguous, or you're about to make an architectural
  judgment call the human hasn't confirmed, stop and ask. Slow and correct
  beats fast and wrong on this project — that is a deliberate project rule,
  not caution for its own sake.
- Never fabricate market, security, or benchmark statistics. If you need a
  number that isn't already documented in the project report or `docs/`,
  ask rather than estimate confidently.

## What NOT to do

- Don't implement future-phase scope "while you're in there."
- Don't touch `main` directly, ever.
- Don't skip a documentation update to save time — an undocumented phase is
  an incomplete phase per `RULE.md` Section A.3.
- Don't merge or push without asking first, even if you're confident the
  change is safe.
- Don't leave `main` in a state that fails to boot or fails CI (`RULE.md`
  Section E).

## Where things live

See the project structure diagram in [README.md](README.md) and the full
component breakdown in [ARCHITECTURE.md](ARCHITECTURE.md). In short:
detection/policy logic lives in `backend/app/`, the dashboard lives in
`frontend/`, policy configuration examples live in `policy/`, and all
process documentation lives in `docs/`.
