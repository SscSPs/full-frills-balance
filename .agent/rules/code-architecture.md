---
trigger: always_on
---

# Codebase Architecture & Standards

This document defines hard architectural constraints for `/Users/sahilsoni/me/projects/full-frills-balance`.
Violations are defects and should be fixed, not justified.

## 1. Architecture Model

### 1.1 Feature-first organization
- Organize by domain in `src/features/*`, not by tech layer.
- A feature owns its screens, feature components, hooks, and feature services.
- Cross-feature reuse goes to shared layers, not sibling feature internals.

### 1.2 Thin routing in `app/`
- `app/` is Expo Router wiring only.
- Route files should import from feature public APIs and pass route params.
- No business logic, data access, domain calculations, or orchestration in `app/` files.

### 1.3 Database as source of truth
- Persisted data in WatermelonDB is the source of truth.
- UI state can represent transient view concerns only.
- Writes are repository-owned and explicit (`await`ed).

## 2. Dependency Direction

Dependency direction is one-way:

`app/` -> `src/features/` -> `src/services/` -> `src/data/` -> `src/utils/`

### Forbidden imports
- Any `src/**` code importing from `app/**`.
- `src/data/**` importing from `src/features/**` or UI component layers.
- `src/services/**` importing from feature UI.
- Cross-feature deep imports into another feature's private files.

## 3. Directory Ownership

- `app/`: route wrappers only.
- `src/features/<feature>/`: feature-specific UI + orchestration.
- `src/components/`: shared UI primitives/compositions.
- `src/services/`: cross-feature business/domain logic.
- `src/data/`: WatermelonDB models, schema, adapters, repositories.
- `src/utils/`: pure helpers with no framework coupling.
- `src/contexts/` and `src/hooks/`: app-wide UI concerns only.

Do not create new top-level architecture buckets unless explicitly approved.

## 4. Feature Boundaries

- Every feature exposes a public API from `src/features/<feature>/index.ts`.
- External consumers must import from that index only.
- Deep imports into sibling feature internals are forbidden.
- If code is reused across features:
  - Shared UI -> `src/components/common`
  - Shared domain logic -> `src/services`
  - Shared persistence logic -> `src/data/repositories`

## 5. WatermelonDB Access Rules

### Reads
- Read through hooks/view-model layers that observe repositories/queries.
- Keep derived values as pure projections.

### Writes
- Perform writes in repositories (or tightly scoped service methods that delegate to repositories).
- No direct DB writes from presentational components.
- No ad-hoc persistence IDs (`Math.random`, `Date.now`) for database records.

## 6. Hook and Component Responsibilities

- Components should be mostly presentational and event-driven.
- Hooks compose view state and call services/repositories through defined boundaries.
- Put multi-step domain rules in services, not JSX trees.
- If a hook becomes a domain engine, extract the logic.

## 7. Import & Path Rules (Enforced)

- Use absolute imports with alias `@/*`.
- In `app/**/*`, do not deep import internals from `src` (enforced via `no-restricted-imports`).
- In `src/**/*`, importing from `app/**` is prohibited (enforced via `no-restricted-imports`).

## 8. Architecture Drift Signals

Refactor when any of these appear:
- Route files becoming workflow controllers.
- Repeated domain logic across feature hooks/components.
- Feature internals imported directly by another feature.
- UI components reading/writing persistence directly.
- Derived balances duplicated in multiple locations.

