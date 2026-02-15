# AGENTS: Full Frills Balance

Repository-level operating rules for coding agents working in `/Users/sahilsoni/me/projects/full-frills-balance`.

## Rule Source of Truth
- Primary rules live under `.agent/rules/`.
- Primary workflows live under `.agent/workflows/`.
- If guidance conflicts, precedence is:
  1. `code-architecture.md`
  2. `coding-practices.md`
  3. `principles.md`
  4. `role.md`

## Skills
- Skills in the home agent directories (for example `~/.agent/skills`, `~/.agents/skills`, and `~/.codex/skills`) may be used when the task clearly matches a skill.
- When a skill is used, read its `SKILL.md` first and follow its workflow.
- Prefer the minimal set of skills needed for the task; do not load unrelated skills.
- Repository architecture and coding rules in this file and `.agent/rules/*` remain authoritative.

## Required Rule Files
- `.agent/rules/code-architecture.md`
- `.agent/rules/coding-practices.md`
- `.agent/rules/principles.md`
- `.agent/rules/role.md`

## Required Workflow Files
- `.agent/workflows/code-review.md`
- `.agent/workflows/audit-codebase.md`
- `.agent/workflows/component-audit.md`
- `.agent/workflows/commit-message-staged.md`

## Non-Negotiable Architecture Constraints
- `app/` is route wiring only.
- `src/features/*` are feature boundaries with public `index.ts` APIs.
- No deep imports across sibling features.
- `src/**/*` must not import from `app/**`.
- WatermelonDB is the source of truth.
- Repository-owned writes; no direct persistence from presentational UI.

## Coding Practices Baseline
- TypeScript strict mode.
- Absolute imports via `@/*`.
- Components stay presentation-first; orchestration in hooks/view-models.
- Cross-feature business logic in `src/services/`.
- Semantic design tokens; avoid hardcoded UI values.
- Use `@/src/utils/logger` for app logging.

## Feature-Specific Standards

### Accounts
- Keep account hierarchy/reorder logic in services/hooks.
- Validate account payloads before persistence.

### Journal
- Enforce journal balancing before save/update.
- Keep entry/list/detail responsibilities separated.

### Reports
- Read-only projections from persisted data.
- Centralize date-range/filter behavior.

### Settings/Import
- Validate import data before writes.
- Keep plugin UI and import execution logic separated.

### Onboarding
- Keep flow/finalization logic in hooks/services.
- Finalization must be idempotent.

### Wealth/Dashboard
- Net worth must derive from canonical balances.
- Summary widgets should stay presentational.

### Audit
- Audit screens are read-only and side-effect free.

## Working Expectations
- Keep changes scoped to task intent.
- Prefer simple, maintainable solutions over speculative abstractions.
- Highlight blockers or architectural conflicts explicitly.
- When reviewing code, prioritize correctness and regression risk first.
