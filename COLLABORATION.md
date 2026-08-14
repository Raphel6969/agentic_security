# COLLABORATION.md — How the Team Works Together

This covers human-to-human (and human-to-agent) collaboration norms. For git
mechanics and phase discipline, see [RULE.md](RULE.md).

## Team shape

Suggested split for a 3–4 person hackathon team, matching the phase plan in
[PHASE.md](PHASE.md):

| Role | Owns | Phases |
|---|---|---|
| Backend/Detection lead | FastAPI proxy, rule engine, ML classifier, LLM-judge, policy engine | 0–4 |
| Agent/Attack lead | Toy agent, tool wiring, staged attack scenarios | 5–6 |
| Frontend lead | React dashboard, live feed, verdict detail view | 7 |
| Integration/Pitch lead | Cross-phase integration, demo rehearsal, deck, floats where needed | All, esp. 8 |

Adjust freely for actual team size — the point is one clear owner per phase,
not rigid role boundaries.

## Communication cadence

Given the short timeline, this project does not run continuous stand-ups.
Instead, check in at **phase boundaries** — exactly the moments `RULE.md`
already requires a permission checkpoint. Use that same checkpoint as the
team sync point: what got built, what's left, what's next.

## Decision-making

- Architectural or scope decisions get logged in `docs/decisions.md` by
  whoever makes them, tagged with the phase.
- Disagreements about scope, architecture, or priority are resolved by the
  human project lead — an AI agent should surface the disagreement and the
  trade-offs, not resolve it unilaterally.
- Any decision that changes something already documented in
  `docs/decisions.md` must say so explicitly ("supersedes Phase 2 decision
  to use X"), not silently overwrite it.

## Code review

Every phase branch gets at least a quick review by one other team member
before merge into `main` — even under time pressure. A five-minute skim
catches most integration breaks before they become demo-day surprises.
Reviewers check: does it match the phase's exit criteria in `PHASE.md`? Is
`docs/status.md` updated? Does `main` still boot after merge?

## Git etiquette

Full mechanics are in `RULE.md` Section B. On top of that:
- Open a PR (even a self-approved one on a solo task) rather than merging
  a phase branch straight in — it creates a natural review/documentation
  checkpoint.
- PR description should restate the phase's exit criteria and confirm
  which are met.
- No direct commits to `main`, ever, by anyone — human or agent.

## Conflict handling

If two people (or a person and an agent) end up touching the same phase's
scope at the same time, whoever asked for and received permission first
proceeds; the other re-syncs their branch after that merge lands, rather
than racing to push first.

## Working with an AI pair-programmer

Treat the agent as a team member bound by the same rules, not an exception
to them — it follows `RULE.md` and `AGENT.md` exactly like a human
contributor would follow `CONTRIBUTING.md`. If the agent asks a clarifying
question before proceeding, that is the system working correctly, not the
agent stalling.
