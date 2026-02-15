# Coding Conventions

Standards and patterns for contributing to Full Frills Balance.

---

## File Organization

```
component-name/
├── ComponentName.tsx     # Main component
├── index.ts              # Re-export
└── ComponentName.test.ts # Tests (if applicable)
```

For simpler components (design system), single file is fine:
```
src/components/core/
├── AppButton.tsx
├── AppCard.tsx
├── ErrorBoundary.tsx
└── index.ts              # Barrel export
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `JournalCard.tsx` |
| Hooks | camelCase with `use` prefix | `useJournals.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| Constants | SCREAMING_SNAKE_CASE | `BALANCE_EPSILON` |
| Types/Interfaces | PascalCase | `AccountType` |

---

## Component Rules

### Design System Components (`src/components/core/`)
- Max 5 props per component
- No hardcoded colors — use theme tokens
- Must work with both `light` and `dark` themeMode
- Document in `_design-preview.tsx` (dev-only)

### Screen Components (`app/`)
- One default export per file
- Extract business logic to hooks
- Use `useTheme()` for consistent theming

---

## State Management

### UIContext — Simple UI state only
```typescript
// ✅ Allowed
hasCompletedOnboarding, themePreference, themeMode, isLoading

// ❌ Not allowed (use hooks/repositories)
accounts, journals, balances, any domain data
```

### Data Hooks — Reactive database access
```typescript
// Pattern: observe + subscribe
const { journals, isLoading, loadMore } = useJournals()
```

---

## Logging

Use `logger` from `@/src/utils/logger`, not `console.*`:

```typescript
import { logger } from '@/src/utils/logger';

logger.info('Operation started', { context });
logger.warn('Something unexpected', { error });
logger.error('Operation failed', error);
```

Debug logs are disabled in production.

---

## Error Handling

1. **Wrap screens** with ErrorBoundary (already done at root)
2. **Repository errors**: Log + throw (let UI handle)
3. **Optional operations**: Log warning, continue gracefully
4. **Critical data errors**: IntegrityService repairs on startup

---

## Testing Philosophy

| Layer | Approach |
|-------|----------|
| Repositories | Jest unit tests with mock database |
| Services | Jest unit tests |
| UI | Visual validation via `/_design-preview` |
| Integration | End-to-end and integration flows in `e2e/` and `src/__tests__/integration/` |

---

## TypeScript Guidelines

- Avoid `as any` — use proper types or `unknown`
- Export interfaces from model files
- Use discriminated unions for status types:
  ```typescript
  type JournalStatus = 'POSTED' | 'VOIDED'
  ```

---

## Commits

Follow conventional commits:
```
feat: add journal pagination
fix: correct running balance on backdated entry
docs: add architecture documentation
refactor: extract form logic to useJournalForm hook
```
