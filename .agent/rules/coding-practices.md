---
trigger: always_on
---

# Coding Practices (Repo Standard)

This file documents practical coding standards for `/Users/sahilsoni/me/projects/full-frills-balance` based on current tooling and structure.

## 1. TypeScript & Language Rules
- Use TypeScript with `strict: true`.
- Avoid `any`; prefer specific types or `unknown` + narrowing.
- Prefer explicit domain types for accounting values and statuses.
- Keep functions small and deterministic where possible.

## 2. Import Rules
- Use absolute imports via `@/*` alias.
- In `app/**/*`, import feature public APIs; avoid deep imports into `src/**` internals.
- In `src/**/*`, never import from `app/**`.
- Avoid cross-feature deep imports; consume `src/features/<feature>/index.ts`.

## 3. Architecture Ownership
- Route wrappers live in `app/` and stay thin.
- Feature orchestration lives in feature hooks/view-models.
- Cross-feature domain logic lives in `src/services/`.
- Persistence lives in `src/data/repositories/`.
- Shared UI primitives/compositions live in `src/components/`.

## 4. React/React Native Patterns
- Prefer functional components and hooks.
- Keep components presentation-focused; move orchestration to hooks.
- Avoid heavy derived computations inside render paths.
- Memoize expensive derived data and unstable callbacks when needed.

## 5. WatermelonDB Practices
- Treat DB as the domain source of truth.
- Use repository-owned writes and await persistence operations.
- Keep observable creation and subscription lifecycle aligned with component lifecycle.
- Avoid duplicating DB state into long-lived React state unless strictly required.

## 6. UI & Design System Usage
- Use semantic tokens/constants; avoid hardcoded colors and spacing magic numbers.
- Prefer shared core/layout/common components before creating new primitives.
- Keep component APIs small and intention-revealing.

## 7. Logging & Errors
- Use `@/src/utils/logger` instead of ad-hoc `console.*` in app logic.
- Throw or propagate repository/service errors when callers need recovery handling.
- For non-critical fallbacks, log with context and degrade gracefully.

## 8. Testing Expectations
- Add/adjust tests when changing business logic, repositories, or invariants.
- Use Jest for unit/integration-level logic and data layers.
- Use Playwright/E2E flows where behavior spans multiple screens.
- Prioritize tests around accounting correctness and migration-sensitive paths.

## 9. Naming & File Conventions
- Components/types/interfaces: PascalCase.
- Hooks/utils/functions: camelCase.
- Keep naming domain-specific and explicit (avoid generic names like `data`, `helper`, `manager`).
- Use feature index files as public API boundaries.

## 10. Change Hygiene
- Keep diffs focused on the requested change.
- Avoid drive-by refactors unless they remove active risk.
- Follow conventional commits for commit subjects.

## 11. Feature-Specific Engineering Standards

### 11.1 Accounts (`src/features/accounts`)
- Keep hierarchy/reorder rules in feature services/hooks, not list-item components.
- Validate account payloads before repository writes.
- Keep account type semantics explicit and avoid implicit defaults.

### 11.2 Journal (`src/features/journal`)
- Enforce balancing invariants before submit/update flows.
- Keep entry/list/detail concerns separated (`entry/`, `list/`, `screens/`).
- Avoid duplicating running-balance math across hooks/components.

### 11.3 Reports (`src/features/reports`)
- Reports should be read-only projections of persisted data.
- Expensive aggregations belong in memoized view-model logic or services.
- Keep date-range/filter logic centralized; do not fork per widget.

### 11.4 Settings & Import (`src/features/settings`, `src/services/import`)
- Treat import as a reliability-sensitive path with explicit error handling.
- Validate and normalize imported data before persistence.
- Keep plugin selection UX separate from import execution logic.

### 11.5 Onboarding (`src/features/onboarding`)
- Keep onboarding state machine logic in hooks/services, not visual steps.
- Finalization must be idempotent to survive retries/restarts.
- Do not leak onboarding-only logic into global app state.

### 11.6 Wealth/Dashboard (`src/features/wealth`, `src/features/dashboard`)
- Net-worth displays must derive from canonical account balances.
- Prefer deterministic read models over ad-hoc local computations.
- Shared summary widgets should remain presentation-only.

### 11.7 Audit (`src/features/audit`)
- Audit trail views are read-only; no mutation side effects in this feature.
- Keep corruption/recovery messaging explicit and user-facing.

