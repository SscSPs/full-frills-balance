---
trigger: always_on
---

# Codebase Architecture & Standards

**Law of the Land**

This document defines **hard constraints** for the codebase.
These are not suggestions, patterns, or preferences.
Violations are architectural defects and must be corrected immediately.

---

## 0. Mental Model (Read This First)

Think in **layers and boxes**:

* **Layers** enforce dependency direction. You never break them.
* **Features** are sealed boxes. You interact only through their public API.

If you are unsure where code belongs, **stop**. Misplaced code is worse than missing code.

---

## 1. Core Philosophy

### 1.1 Feature-First Architecture

The codebase is organized by **domain**, not by technology.

Each feature owns:

* Screens
* Feature-only UI components
* Feature-only hooks
* Feature-specific domain logic

If code cannot be clearly assigned to **exactly one feature**, it does not belong in a feature.

---

### 1.2 Thin Routing (Non-Negotiable)

The `app/` directory is a **routing layer only**.

Allowed:

* Importing a screen from a feature
* Passing navigation params

Forbidden:

* Business logic
* Data access
* Calculations
* Local state (except navigation configuration)

**Rule of thumb**: if a file in `app/` exceeds ~20 lines, it is wrong.

---

### 1.3 Data-Driven UI

The database is the **single source of truth**.

* UI reacts to persisted data
* UI never invents or persists domain state
* All writes happen in repositories, and only there

Derived values must be **pure projections** of persisted data, not new domain rules.

---

## 2. Dependency Direction (Non-Negotiable)

Dependencies flow strictly downward:

```
app/
  → src/features/
    → src/services/
      → src/data/
        → src/utils/
```

### Forbidden directions

* `src/data` importing from anything above it
* `src/services` importing from features or UI
* `src/components` importing from features
* Any layer importing from `app/`

**UI depends on data. Data never depends on UI.**

These rules are enforced by linting. Violations are build failures.

---

## 3. Directory Structure (Strict)

Do not create new top-level directories.

```
/
├── app/                      # ROUTING ONLY
│   ├── (tabs)/
│   ├── _layout.tsx
│   └── *.tsx                 # Import Screen from src/features/*
│
├── src/                      # APPLICATION CORE
│   ├── features/             # DOMAIN BOUNDARIES
│   │   ├── accounts/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/     # FEATURE-SPECIFIC BUSINESS RULES
│   │   │   └── index.ts      # PUBLIC API
│   │   └── ...
│   │
│   ├── components/           # SHARED UI ONLY
│   │   ├── core/
│   │   ├── layout/
│   │   └── common/
│   │
│   ├── data/                 # DATA LAYER
│   │   ├── database/
│   │   ├── models/
│   │   └── repositories/
│   │
│   ├── services/             # CROSS-FEATURE BUSINESS RULES
│   │   └── *.ts              # Pure TypeScript, no React, no DB writes
│   │
│   ├── hooks/                # GLOBAL UI HOOKS ONLY
│   ├── contexts/             # GLOBAL UI STATE
│   └── utils/                # PURE HELPERS
```

---

## 4. Feature Boundary Rules

Each feature is a **sealed box**.

### Allowed imports inside a feature

* `src/components/**`
* `src/services/**`
* `src/data/**` (via hooks or repositories only)
* `src/utils/**`

### Forbidden imports

* Internal files from another feature
* Components, hooks, or screens from sibling features

If multiple features need the same code:

* Shared UI → `src/components/common`
* Shared business rules → `src/services`

---

## 5. Feature Public API (Mandatory)

Every feature must expose a public interface:

```
src/features/<feature>/index.ts
```

Rules:

* Only exports from `index.ts` may be imported outside the feature
* All other files are private implementation details
* Deep imports into features are forbidden and linted

Encapsulation is enforced mechanically, not socially.

---

## 6. Where Does This Go? (Decision Tree)

Follow this order exactly.

### 6.1 Is it a Screen?

* YES → `src/features/<feature>/screens/<Name>Screen.tsx`
* Ensure a thin route exists in `app/`

### 6.2 Is it UI?

* Primitive → `components/core`
* Layout → `components/layout`
* Shared across features → `components/common`
* Feature-only → `features/<feature>/components`

Shared components must be **logic-free**.

### 6.3 Is it Logic or State?

* UI-only state → local state or `contexts/`
* Feature business rules → `features/<feature>/services`
* Cross-feature business rules → `src/services`
* Persistence → `data/models` + `repositories`
* Pure helpers → `utils`

---

## 7. Data Access Rules

### Reads

* Performed via **reactive hooks**
* Hooks may expose **pure projections** of persisted data
* No domain rules inside hooks

### Writes

* Performed **only** in repositories
* Never from UI, hooks, or services
* All writes must be explicitly awaited

---

## 8. Hook Constraints

Hooks are **composition tools**, not decision-makers.

Hooks may:

* Read data
* Compose UI-facing state
* Call services

Hooks may NOT:

* Write to repositories
* Implement business rules
* Enforce permissions or correctness

If a hook exceeds ~50 lines or feels clever, it belongs in services.

### 8.1 Performance Rules

* All action callbacks must be memoized with `useCallback`
* Prefer a single consolidated observer per screen
* Consolidated hooks must remain focused and small

---

## 9. Components Standards

* Functional components only
* `React.memo` when props are simple
* Never use raw `Text`; always use `AppText`
* Use design tokens only
* Props interface must be exported as `<ComponentName>Props`

Shared components must not import services or data.

---

## 10. Naming & Imports

### Naming

* Components: `PascalCase.tsx`
* Hooks / utils: `camelCase.ts`
* Folders: `kebab-case`

### Imports

* Absolute imports only (`@/src/...`)
* No relative parent imports
* Violations fail linting

---

## 11. Strict Prohibitions

🔴 Logic in `app/`
🔴 DB access outside repositories
🔴 Coupling sibling features
🔴 Domain components in `components/`
🔴 Services called directly from UI
🔴 Ad-hoc IDs for persistence

Violations require refactoring, not justification.

---

## 12. Common Failure Signals

Immediate refactor required if you see:

* Large `app/` files
* God hooks (over 50 lines)
* Shared components with logic
* Services importing React
* "Temporary" code in shared layers

---

## 13. Verification Checklist

Before marking work complete, **every PR must satisfy all of the following**:

* [ ] `app/` contains routing only (no logic, no state)
* [ ] Imports respect dependency direction
* [ ] Code lives in the correct feature or shared layer
* [ ] No direct DB access outside repositories
* [ ] Hooks do not implement business rules
* [ ] Shared components are logic-free
* [ ] `AppText` is used instead of raw `Text`
* [ ] Feature boundaries are respected (no deep imports)

Failure on any item blocks the PR.

---

## 14. Type Management

* UI-facing domain read models belong in `src/types/domain.ts`
* Do not redefine domain shapes locally

---

## 15. Final Rule

This document exists to prevent entropy.

If something feels hard to place, the structure is wrong.
Fix the structure first. Code comes second.
