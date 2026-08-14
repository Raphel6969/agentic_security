# SECURITY.md

Sentinel Layer is a security tool, which means its own security hygiene is
part of the pitch, not an afterthought.

## Scope disclaimer

This is a hackathon-stage project. It is a demonstration of an architecture
and detection approach, **not** a production-hardened security product.
Do not deploy it to protect real production agents handling sensitive data
without a proper security review first.

## Reporting a vulnerability in this repo

If you find a security issue in Sentinel Layer itself (not in the general
concept, but in this specific codebase):

1. Do not open a public GitHub issue describing the vulnerability in detail.
2. Contact the project lead directly (see `README.md` for current contact
   info) with a description and, if possible, reproduction steps.
3. Allow a reasonable window to address it before any public disclosure.

## Practices this repo follows

- **No secrets in Git.** API keys (Groq, etc.) are loaded from environment
  variables only — see `.env.example`. `.env` itself is git-ignored.
- **Dependency hygiene.** `backend/requirements.txt` is kept minimal and
  pinned; update deliberately, not automatically, during a hackathon
  timeline.
- **CI runs tests on every PR** (see `.github/workflows/ci.yml`) before
  anything merges to `main`.
- **No real third-party exploitation.** All staged attack scenarios
  (Phase 6, `PHASE.md`) run against the project's own toy agent/sandbox —
  never against a real external system. This is a hard rule, not a
  suggestion (see `RULE.md`'s underlying project report, Chapter 10).

## Known limitations (be upfront about these in the pitch)

- The detection cascade is probabilistic — it reduces risk, it does not
  guarantee zero false negatives.
- The LLM-judge (Phase 4) depends on an external API (Groq); a fallback
  behaviour for API unavailability must be explicit, not silent (see
  `API.md`, `503` response).
- Training/eval data for the ML classifier comes from public benchmark
  datasets plus self-generated synthetic session logs — not real production
  agent traffic (see project report, Chapter 10).
