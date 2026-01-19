# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **ErrorBoundary component** — Catches JS errors and shows fallback UI instead of white screen
- **Journal pagination** — `useJournals(pageSize)` with infinite scroll support
- **JSON export** — Export all data via share sheet (Reports tab)
- **themeMode** in UIContext — Computed property resolving system vs user preference

### Changed
- **Tab bar height** — Now uses `useSafeAreaInsets()` instead of hardcoded 60px
- **Logging** — Replaced `console.warn` with `logger.warn` in preferences.ts
- **Design preview** — Gated behind `__DEV__` to prevent production access

### Fixed
- N/A

### Security
- N/A

---

## [1.0.0] - Initial Release

### Added
- Double-entry accounting core
- Account management (Asset, Liability, Equity, Income, Expense)
- Journal entries with transaction lines
- Net worth dashboard
- WatermelonDB with offline-first architecture
- IntegrityService for balance verification
- Ivy Wallet-inspired design system
