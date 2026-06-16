# ADR-0001 — Adopt the AI operating model

- **Status:** accepted
- **Date:** 2026-06-12

## Context

`my-fleet-mobile` is an in-production Expo SDK 54 app that predates our skeleton standards (EXPO-SKELETON). It has real users, real payments (Stripe Checkout), a patched dependency, no automated tests, and several legacy patterns (monolithic screens, dual styling systems, unparsed API responses). Rewriting or migrating it would be high-risk and is not the goal.

## Decision

Adopt the AI operating model **additively**, without migrating existing code:

- Every session follows the loop in `AGENTS.md`: Ground → Plan → Implement → Verify → Encode.
- New code follows the target conventions in `docs/conventions/code-style.md` §(b); legacy code is documented (here and in `docs/quality/debt-map.md`), not rewritten.
- Product intent is captured in `docs/product/` (reverse-engineered PRD, overview, critical user journeys) and kept current.
- Workflow is enforced by the skills in `.claude/skills/` (create-spec, plan-feature, implement-feature, review, verify, encode-lesson, update-docs, write-prd).

## Consequences

- New code is held to a stricter standard than the code around it; the gap is intentional and visible.
- Legacy zones are entered deliberately (flagged in plans/reviews), never casually.
- Future architectural choices get an ADR in this folder (`docs/architecture/decisions/NNNN-slug.md`).
- Docs are part of the definition of done: a change that invalidates a doc updates it in the same PR.
