# RULE.md — Sentinel Layer Development Rules

These rules govern how *any* developer or AI pair-programmer works on this
repository. They are not suggestions — every phase of work must follow them.
If you are an AI agent picking this project up for the first time, **read
this file in full before writing or changing any code**, then read
[AGENT.md](AGENT.md).

## Guiding principle

Don't rush. Ask before doing. This project moves phase by phase, slowly and
deliberately — slow enough to stay correct, swift enough to still ship on a
short timeline, and professional enough that the repo is deployable and
well-documented at every single checkpoint, not just at the end. When in
doubt, stop and ask rather than guess.

---

## A. Phase Discipline

1. Work happens **one phase at a time**, in the exact order defined in
   [PHASE.md](PHASE.md) (Phase 0 → Phase 8).
2. While inside a phase, **do not implement scope that belongs to a later
   phase**, even if it seems convenient or "while I'm in here." If you
   notice something a later phase will need, note it in
   [docs/decisions.md](docs/decisions.md) instead of building it early.
3. A phase is not "done" until:
   - its exit criteria (as defined in `PHASE.md`) are met, **and**
   - its documentation has been updated (Section D), **and**
   - the human lead has explicitly approved moving on (Section C).
4. If a phase turns out to be bigger than expected, stop and flag it rather
   than silently absorbing extra scope. Propose splitting it into
   sub-phases (e.g. `phase-3a`, `phase-3b`) and get sign-off before
   continuing.

## B. Branching & Commits

1. Every phase gets its **own Git branch**, named exactly as specified in
   `PHASE.md` (e.g. `phase-2-rule-engine`, `phase-6-toy-agent`).
2. Never commit directly to `main`. `main` only receives merges from a
   completed, approved phase branch.
3. Commit **frequently and atomically** within a phase branch — one
   logical change per commit, not one giant commit at the end of the
   phase. A phase branch should typically have somewhere between 5 and 20
   commits, not 1.
4. Commit messages follow this format:
   ```
   [phase-N] short imperative summary

   - what changed
   - why (1 line is enough)
   ```
5. Do not rewrite or force-push history on a branch that has already been
   shared/reviewed without explicit permission.
6. Push and commit **time to time within the phase**, not just at the end —
   small, frequent pushes (after permission, see Section C) keep the repo
   deployable and reviewable throughout, not only at phase boundaries.

## C. Permission Checkpoints

1. **Always ask for explicit permission before:**
   - pushing any commit to the remote repository,
   - opening a merge/pull request from a phase branch into `main`,
   - starting a new phase (even the next sequential one),
   - deviating from the plan in `PHASE.md` in any way.
2. When asking permission, state plainly: what was just built, what the
   exit criteria say, whether they're met, and what you propose doing
   next. Wait for a clear go-ahead before proceeding.
3. If the human lead is unavailable and a decision is genuinely blocking
   (e.g. a dependency is broken), document the blocker in
   `docs/decisions.md`, make the smallest safe fix needed to keep moving,
   and flag it clearly for review — do not make silent judgment calls on
   scope or architecture.

## D. Documentation Requirements

Documentation is not an afterthought — it is what lets any teammate, or
any new AI agent, pick up this project **with a full-context head start
and no re-reading of the whole codebase.** Two files carry this weight:

### `docs/decisions.md` — updated every phase and every non-trivial commit
For each entry, record:
- **Phase / commit:** which phase and (if relevant) which commit this
  relates to.
- **What was built:** a plain description, not a code diff.
- **What's left in this phase:** anything from the phase's scope not yet
  done.
- **Technical decisions made, and why:** e.g. "chose sentence-transformers
  over a fine-tuned classifier for Phase 3 because it needs no training
  data and runs fully local — revisit if accuracy is too low in testing."
- **Anything deferred to a later phase**, with a one-line reason.

### `docs/status.md` — a living snapshot, rewritten (not appended) after every phase
Keep exactly three sections, always current:
```markdown
## Built
- ...

## In progress
- ...

## Not started
- ...
```
This file should let a new agent understand the entire project state in
under one minute, without reading `decisions.md` or the code.

### Rule of thumb
If a new AI agent, given only `RULE.md`, `AGENT.md`, `docs/status.md`, and
`docs/decisions.md`, could **not** correctly state (a) what phase we're
on, (b) what's built, and (c) what to do next — the documentation for the
last phase or commit was not sufficient. Fix it before moving on.

## E. Deployability standard

Every phase, once merged, must leave `main` in a state that boots and
passes CI — not just "code exists." Phase 0 sets this bar (working app,
passing health check, green CI) and every later phase is required to
maintain it, not just add to it. If a phase would temporarily break this,
stop and ask before merging.

---

## F. Quick Checklist (use before every commit and every phase transition)

- [ ] Am I still inside the current phase's declared scope?
- [ ] Have I committed in small, logical, well-labelled steps?
- [ ] Have I updated `docs/decisions.md` for what just changed?
- [ ] Have I rewritten `docs/status.md` to reflect current reality?
- [ ] Does `main` still boot and pass CI after this change?
- [ ] Have I asked for explicit permission before pushing / merging /
      starting the next phase?

If any box is unchecked, stop and address it before continuing.
