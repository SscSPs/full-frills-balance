# Test Coverage Mapping

## How to Run Tests
1. Run unit/integration tests: `npm test`
2. Run E2E tests: `npm run test:e2e`
3. Optional UI mode for E2E debugging: `npm run test:e2e:ui`

## E2E Journey Coverage (Current Files)

| User Journey | Playwright Test File | Status |
| :--- | :--- | :--- |
| Onboarding flow | `e2e/onboarding.test.ts` | ✅ Active |
| Accounts flow | `e2e/accounts.test.ts` | ✅ Active |
| Transactions / journal flow | `e2e/transactions.test.ts` | ✅ Active |
| Settings flow | `e2e/settings.test.ts` | ✅ Active |
| Reports flow | `e2e/reports.test.ts` | ✅ Active |
| Multi-currency flow | `e2e/multi-currency.test.ts` | ✅ Active |

## Feature Coverage Snapshot

| Feature | Coverage Notes |
| :--- | :--- |
| Accounts | Account creation/list/edit/delete-path validations in E2E + service/repository unit tests. |
| Journal | Entry/edit/list behaviors in E2E and hook/service-level tests. |
| Reports | Report rendering and interaction coverage via `e2e/reports.test.ts`. |
| Settings | Theme/privacy/reset/import-selection paths in `e2e/settings.test.ts`. |
| Persistence & data integrity | Repository and service tests under `src/data/repositories/__tests__` and `src/services/**/__tests__`. |

## Notes
- Legacy references to old E2E filenames were removed to keep this map aligned with the current `e2e/` directory.
- Keep this file updated when adding or renaming Playwright specs.
