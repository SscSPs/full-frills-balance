# Full Frills Balance

A double-entry personal finance app built with React Native and Expo. Track your net worth with proper accounting semantics.

## Philosophy

> **"Balances are derived, never cached"**

- All balances come from transaction sums
- Journals must always balance (debits = credits)
- Offline-first — no network required
- Every mutation leaves an audit trail

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full technical overview.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start
```

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System layers, data models, services |
| [CONVENTIONS.md](docs/CONVENTIONS.md) | Coding standards, naming, testing |
| [CHANGELOG.md](docs/CHANGELOG.md) | Version history and changes |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | UI component guidelines |

## Tech Stack

- **Framework**: Expo SDK 54, React Native
- **Navigation**: Expo Router (file-based)
- **Database**: WatermelonDB (SQLite)
- **State**: React Context + observable hooks
- **Design**: Ivy Wallet-inspired system

## Testing

```bash
npm test                    # Run Jest tests
npx expo start --dev-client # Visual testing via /_design-preview
```

## Project Principles

See [.agent/rules/principles.md](.agent/rules/principles.md) for the guiding principles that shape every decision in this codebase.
