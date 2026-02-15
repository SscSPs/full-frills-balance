# Architecture Standards

Canonical architecture rules are maintained in:

- `.agent/rules/code-architecture.md`
- `.agent/rules/coding-practices.md`
- `AGENTS.md`

This file is a lightweight pointer to avoid rule drift.

## Current high-level structure

- `app/`: Expo Router route wiring only.
- `src/features/`: feature modules with public `index.ts` APIs.
- `src/components/`: shared UI primitives/layout/common compositions.
- `src/services/`: cross-feature domain logic.
- `src/data/`: WatermelonDB schema/models/repositories.
- `src/utils/`: pure helpers.

## Non-negotiables

- No `src/**` imports from `app/**`.
- No deep imports across sibling feature internals.
- WatermelonDB is the source of truth.
- Repository-owned writes (no direct persistence from presentational UI).

For detailed rules and decision trees, use `.agent/rules/code-architecture.md`.
