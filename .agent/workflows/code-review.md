---
description: Changeset-focused production code review for staged Expo + WatermelonDB changes
---

Use this workflow to review staged changes (`git diff --cached`).

## Objective
Catch regressions and architecture drift before commit.

## Scope
- Review only staged changes plus directly impacted nearby code.
- Do not expand into unrelated refactors.

## Mandatory checks
- Accounting correctness and balancing invariants.
- WatermelonDB usage correctness (actions/queries/observables/lifecycle).
- No state duplication across DB, hooks, and component state.
- No boundary violations (`app` thin routing, feature encapsulation, repository ownership).
- No obvious performance regressions in render/subscription paths.

## Principles
- DRY: avoid duplicated logic and query paths.
- YAGNI: avoid abstractions without current usage.
- Single source of truth: no mirrored domain state without invalidation strategy.
- Explicit ownership: UI vs service vs repository boundaries must be clear.

## Output format
1. Summary verdict (safe / risky / blocked).
2. Blocking issues (must fix before merge).
3. Non-blocking issues (important but not merge-blocking).
4. Suggested simplifications (optional).

For each issue include:
- File(s)
- Exact pattern
- Why it is a problem here
- Concrete fix

