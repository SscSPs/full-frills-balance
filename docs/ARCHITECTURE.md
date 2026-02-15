# Architecture Overview

This document describes the technical architecture of Full Frills Balance, a double-entry personal finance app built with React Native and Expo.

## Core Principles

> **"Balances are derived, never cached"** — All account balances come from transaction sums, not stored values.

1. **Double-Entry Accounting**: Every transaction touches exactly two accounts (debit + credit)
2. **Journals Always Balance**: A journal entry must sum to zero (debits = credits)
3. **Offline-First**: All data lives locally; no network required for core operations
4. **Audit Trail**: Every mutation is logged for accountability

---

## System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     App Layer (Expo Router)                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐   │
│  │Dashboard│  │Accounts │  │ Reports │  │ Journal Entry│   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬───────┘   │
└───────┼────────────┼───────────┼───────────────┼───────────┘
        │            │           │               │
┌───────┴────────────┴───────────┴───────────────┴───────────┐
│                     Hooks Layer                             │
│  useJournals() · useAccounts() · useNetWorth() · useSummary │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                   Repository Layer                          │
│  JournalRepository · AccountRepository · ExchangeRateRepo   │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                   Data Layer (WatermelonDB)                 │
│  Journal · Transaction · Account · Currency · AuditLog     │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Expo Router route wrappers and navigation wiring |
| `src/features/` | Feature boundaries (accounts, journal, reports, settings, etc.) |
| `src/components/` | Reusable UI components (core/layout/common) |
| `src/contexts/` | React contexts for app-wide UI concerns |
| `src/hooks/` | Global hooks and observable helpers |
| `src/data/` | Database schema, models, and repositories |
| `src/services/` | Business logic services (integrity, export) |
| `src/utils/` | Pure utilities (logger, formatting, preferences) |

---

## Data Models

### Journal
The atomic unit of accounting. Groups 2+ transactions that must sum to zero.

| Field | Type | Notes |
|-------|------|-------|
| `journalDate` | timestamp | When the transaction occurred |
| `status` | POSTED/VOIDED | Only POSTED affects balances |
| `totalAmount` | number | Denormalized sum of debits |
| `displayType` | string | INCOME/EXPENSE/TRANSFER/MIXED |

### Transaction
One leg of a journal entry.

| Field | Type | Notes |
|-------|------|-------|
| `amount` | number | Always positive |
| `transactionType` | DEBIT/CREDIT | Determines effect on account |
| `runningBalance` | number | Rebuildable cache for list display |

### Account
Where money lives or flows.

| Type | Debit Effect | Credit Effect |
|------|--------------|---------------|
| ASSET | +increase | -decrease |
| LIABILITY | -decrease | +increase |
| EQUITY | -decrease | +increase |
| INCOME | -decrease | +increase |
| EXPENSE | +increase | -decrease |

---

## Services

### IntegrityService
Runs on app startup. Computes actual balances from transactions and compares to cached `runningBalance`. Repairs discrepancies silently.

### ExportService
Exports all accounts, journals, and transactions as JSON. Uses `expo-sharing` for native share sheet.

---

## Error Handling

- **ErrorBoundary**: Wraps root Stack, catches JS errors, shows fallback UI
- **IntegrityService**: Self-heals balance discrepancies
- **Logger**: Structured logging via `src/utils/logger.ts`

---

## Performance Patterns

1. **Denormalization**: `Journal.totalAmount` and `displayType` avoid joins in list views
2. **Pagination**: `useJournals(pageSize)` with `Q.take()` + infinite scroll
3. **Debouncing**: `useNetWorth` debounces recalculation by 300ms
4. **FlashList**: Virtualized lists for large datasets
