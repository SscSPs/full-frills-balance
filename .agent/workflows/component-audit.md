---
description: Component architecture audit for entropy reduction in Expo React Native UI code
---

Use this workflow to audit component structure and boundaries in targeted areas or across the repo.

## Goal
Reduce long-term UI entropy by tightening ownership and removing harmful abstractions.

## Audit checks
- Screens should orchestrate, not implement domain/business rules.
- Presentational components should not fetch or persist data.
- Hooks/view-models should own orchestration and derived view state.
- Detect duplicated JSX/interaction patterns that should be consolidated.
- Detect over-configured base components with weak cohesion.

## Action types
For each finding, choose exactly one:
- DELETE
- MERGE
- SPLIT
- EXTRACT HOOK
- INLINE INTO CALLER

## Output format per finding
A. Files involved
B. What is wrong and why it increases entropy
C. Action type
D. Proposed structure (name + location + ownership)
E. Minimal before/after sketch

## Constraints
- Prefer composition over boolean prop explosions.
- Do not keep components for speculative future reuse.
- Consolidate logic where duplication threatens correctness.

