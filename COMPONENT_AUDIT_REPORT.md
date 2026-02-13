# Component Architecture Audit Report

## Executive Summary

The codebase demonstrates **strong architectural foundations** with consistent View/ViewModel patterns, proper separation of concerns in screens, and well-defined component hierarchies. Most screens follow the thin-wrapper pattern correctly.

**Overall Grade: B+** - Good architecture with minor violations and some consolidation opportunities.

---

## 1. Architecture Violations

### FINDING-001: Duplicate Date Filter UI Pattern

**A. Files involved**
- `src/features/reports/components/ReportsView.tsx:32-43`
- `src/components/common/DateRangeFilter.tsx` (existing component)

**B. What is wrong**
ReportsView manually implements a date filter button instead of using the existing `DateRangeFilter` component. This duplicates:
- TouchableOpacity wrapper pattern
- Calendar icon + text + chevron layout
- Theme-aware styling logic

This increases entropy by creating two ways to render the same UI pattern.

**C. Action**
REPLACE

**D. Proposed structure**
- Use `DateRangeFilter` component directly in ReportsView
- Remove custom filter button implementation
- Pass `showNavigationArrows={false}` since reports don't need period navigation

**E. Minimal example**

Before:
```tsx
<View style={styles.filterBar}>
    <TouchableOpacity style={[styles.filterButton, ...]} onPress={onOpenDatePicker}>
        <AppIcon name="calendar" ... />
        <AppText ...>{dateLabel}</AppText>
        <AppIcon name="chevronDown" ... />
    </TouchableOpacity>
</View>
```

After:
```tsx
<DateRangeFilter
    range={dateRange}
    onPress={onOpenDatePicker}
    showNavigationArrows={false}
/>
```

---

### FINDING-002: View Components Receiving Theme

**A. Files involved**
- `src/features/reports/components/ReportsView.tsx:13` (vm.theme)
- `src/features/audit/components/AuditLogView.tsx:11` (vm.theme)
- `src/features/settings/components/SettingsView.tsx:11` (vm.theme)
- `src/features/journal/components/TransactionDetailsView.tsx:11` (vm.theme)
- `src/features/accounts/components/AccountDetailsView.tsx:12` (vm.theme)
- `src/features/journal/entry/components/JournalEntryView.tsx:13` (vm.theme)
- `src/features/dashboard/components/DashboardScreenView.tsx:9` (indirectly via props)

**B. What is wrong**
View components receive `theme` from ViewModel but could call `useTheme()` directly. This creates:
- Unnecessary prop threading through ViewModels
- ViewModels responsible for providing presentation-layer concerns
- Violation of "Screens only wire data → components" rule

**C. Action**
EXTRACT HOOK

**D. Proposed structure**
- Views should call `useTheme()` directly
- ViewModels should not export theme
- Reduces ViewModel interface surface area

**E. Minimal example**

Before:
```tsx
// ViewModel
return { theme, loading, data };

// View
function ReportsView(vm: ReportsViewModel) {
    const { theme, loading, data } = vm;
    return <View style={{ backgroundColor: theme.background }}>...</View>;
}
```

After:
```tsx
// ViewModel
return { loading, data }; // No theme

// View
function ReportsView(vm: ReportsViewModel) {
    const { loading, data } = vm;
    const { theme } = useTheme(); // Direct access
    return <View style={{ backgroundColor: theme.background }}>...</View>;
}
```

---

### FINDING-003: Loading State Duplication

**A. Files involved**
- `src/features/accounts/components/AccountDetailsView.tsx:41-49`
- `src/features/journal/components/TransactionDetailsView.tsx:28-34`
- `src/features/audit/components/AuditLogView.tsx:24-28`
- `src/features/dashboard/components/DashboardScreenView.tsx:16-25`

**B. What is wrong**
Multiple views implement identical loading states:
- Centered ActivityIndicator
- Optional loading text below
- Full-screen flex container

This is presentational logic that should be centralized.

**C. Action**
MERGE

**D. Proposed structure**
- Enhance `LoadingView` component to support optional text
- Replace inline loading implementations with `<LoadingView />`
- Location: `src/components/common/LoadingView.tsx`

**E. Minimal example**

Before:
```tsx
if (accountLoading) {
    return (
        <Screen title="Details">
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        </Screen>
    );
}
```

After:
```tsx
if (accountLoading) {
    return (
        <Screen title="Details">
            <LoadingView />
        </Screen>
    );
}
```

---

### FINDING-004: Empty State Pattern Duplication

**A. Files involved**
- `src/features/audit/components/AuditLogView.tsx:29-35`
- `src/features/journal/components/JournalListView.tsx:66-75`
- `src/features/accounts/components/AccountsListView.tsx:106-112`

**B. What is wrong**
Empty states follow the same pattern but implemented separately:
- Icon (sometimes) + title + subtitle
- Centered layout
- Consistent vertical padding

The `EmptyStateView` component exists but isn't used consistently.

**C. Action**
MERGE

**D. Proposed structure**
- Use `EmptyStateView` consistently across all list components
- Pass appropriate title/subtitle props
- Audit all ListEmptyComponent implementations

**E. Minimal example**

Before:
```tsx
ListEmptyComponent={
    <View style={styles.emptyContainer}>
        <AppText variant="heading">{emptyTitle}</AppText>
        <AppText variant="body" color="secondary">{emptySubtitle}</AppText>
    </View>
}
```

After:
```tsx
ListEmptyComponent={<EmptyStateView title={emptyTitle} subtitle={emptySubtitle} />}
```

---

### FINDING-005: Header Actions Pattern Duplication

**A. Files involved**
- `src/features/accounts/components/AccountDetailsView.tsx:66-94`
- `src/features/journal/components/TransactionDetailsView.tsx:54-81`

**B. What is wrong**
Both views construct `headerActions` nodes inline with similar patterns:
- IconButton groups
- Conditional rendering based on state
- TestID props for testing

This is presentational composition that could be standardized.

**C. Action**
EXTRACT HOOK / SPLIT

**D. Proposed structure**
Create a `HeaderActions` component that accepts configuration:

```tsx
// New component
interface HeaderActionsProps {
  actions: Array<{
    name: IconName;
    onPress: () => void;
    variant?: IconButtonVariant;
    iconColor?: string;
    testID?: string;
  }>;
}

// Usage
<Screen headerActions={<HeaderActions actions={vm.headerActions} />} />
```

**E. Minimal example**

Before:
```tsx
const headerActionsNode = (
    <View style={styles.headerActions}>
        <IconButton name="edit" onPress={headerActions.onEdit} ... />
        <IconButton name="delete" onPress={headerActions.onDelete} ... />
    </View>
);
```

After:
```tsx
<Screen headerActions={<HeaderActions actions={vm.headerActionsConfig} />} />
```

---

### FINDING-006: Section/Divider Pattern in Settings

**A. Files involved**
- `src/features/settings/components/SettingsView.tsx` (multiple sections)

**B. What is wrong**
SettingsView manually implements section dividers:
```tsx
<View style={[styles.divider, { backgroundColor: theme.divider }]} />
```

This appears 4+ times. The `Divider` core component exists but isn't used.

**C. Action**
REPLACE

**D. Proposed structure**
- Use existing `Divider` component from `@/src/components/core`
- Remove inline View-based dividers

**E. Minimal example**

Before:
```tsx
<View style={[styles.divider, { backgroundColor: theme.divider }]} />
```

After:
```tsx
<Divider />
```

---

### FINDING-007: DashboardHeader Contains Logic

**A. Files involved**
- `src/features/dashboard/components/DashboardHeader.tsx` (inferred from DashboardScreenView.tsx:34)

**B. What is wrong**
DashboardHeader receives 15+ props from ViewModel through headerProps:
- greeting, netWorth, totalAssets, totalLiabilities
- isSummaryLoading, isDashboardHidden, onToggleHidden
- income, expense, searchQuery, onSearchChange
- dateRange, showDatePicker, navigatePrevious, navigateNext
- sectionTitle

This suggests DashboardHeader is doing too much and mixing concerns.

**C. Action**
SPLIT

**D. Proposed structure**
Split DashboardHeader into:
1. `NetWorthSummary` - Pure display of wealth metrics
2. `DashboardFilterBar` - Search + DateRangeFilter composition
3. DashboardScreenView composes these together

**E. Minimal example**

Before:
```tsx
<JournalListView
    listHeader={<DashboardHeader {...headerProps} />}
    ...
/>
```

After:
```tsx
<JournalListView
    listHeader={
        <>
            <NetWorthSummary {...netWorthProps} />
            <DashboardFilterBar {...filterProps} />
            <AppText variant="subheading">{sectionTitle}</AppText>
        </>
    }
    ...
/>
```

---

### FINDING-008: JournalListView Props Interface Too Wide

**A. Files involved**
- `src/features/journal/components/JournalListView.tsx:12-37`

**B. What is wrong**
JournalListView has 20+ props including:
- Screen layout props (screenTitle, showBack, backIcon, headerActions)
- List data props (items, isLoading, isLoadingMore, etc.)
- Empty state props (emptyTitle, emptySubtitle)
- Date picker props (datePicker object)
- FAB props

This component is trying to be too configurable. It should be composed, not configured.

**C. Action**
SPLIT

**D. Proposed structure**
Break JournalListView into layers:
1. `JournalList` - Pure list with items + renderItem
2. `JournalListScreen` - Adds Screen wrapper + FAB
3. Dashboard composes its own version with custom header

**E. Minimal example**

Before:
```tsx
<JournalListView
    screenTitle={...}
    showBack={...}
    listHeader={...}
    items={...}
    datePicker={...}
    fab={...}
    // 15+ more props
/>
```

After:
```tsx
<Screen ...>
    <JournalList
        items={...}
        ListHeaderComponent={...}
    />
    <FloatingActionButton ... />
    <DateRangePicker ... />
</Screen>
```

---

## 2. Duplication and Near-Duplication

### FINDING-009: DateRangePicker / useDateRangePicker Logic

**A. Files involved**
- `src/components/common/DateRangePicker.tsx` (component)
- `src/components/common/hooks/useDateRangePicker.ts` (hook)
- `src/hooks/useDateRangeFilter.ts` (similar hook)

**B. What is wrong**
Two similar date range management hooks exist:
- `useDateRangePicker` - UI state for picker modal
- `useDateRangeFilter` - Filter state + period navigation

They manage overlapping concerns (filter state, period selection).

**C. Action**
MERGE

**D. Proposed structure**
Consolidate into single `useDateRangeFilter` that handles both:
- Picker visibility state
- Filter state management
- Period navigation (next/previous)

**E. Minimal example**

Before:
```tsx
// DateRangePicker uses useDateRangePicker
// Consumers also use useDateRangeFilter
// Two sources of truth for date state
```

After:
```tsx
// Single hook handles all date range concerns
const { 
    dateRange, 
    periodFilter, 
    isPickerVisible,
    navigatePrevious,
    navigateNext,
    setFilter 
} = useDateRangeFilter();
```

---

### FINDING-010: Account Card Pattern in Multiple Places

**A. Files involved**
- `src/features/accounts/components/AccountsListView.tsx:123-192` (AccountCardView)
- `src/features/onboarding/components/StepAccountSuggestions.tsx` (inferred)

**B. What is wrong**
Account card UI likely duplicated between:
- Accounts list display
- Onboarding account selection
- Possibly other selection contexts

**C. Action**
MERGE

**D. Proposed structure**
Extract `AccountCard` component that accepts:
- `account` data
- `variant: 'display' | 'selectable'`
- `onPress` handler
- `selected` boolean (for selectable variant)

**E. Minimal example**

```tsx
<AccountCard
    account={account}
    variant="selectable"
    selected={isSelected}
    onPress={handlePress}
/>
```

---

### FINDING-011: Theme Hook Inconsistency

**A. Files involved**
- `src/hooks/use-theme.ts`
- `src/hooks/useThemedComponent.ts`
- `src/constants/theme-helpers.ts` (useThemeColors)

**B. What is wrong**
Three different ways to access theme:
1. `useTheme()` - Returns { theme, themeMode }
2. `useThemedComponent(themeMode?)` - Returns { theme, tokens }
3. `useThemeColors(themeMode?)` - Returns theme colors only

This creates confusion about which hook to use when.

**C. Action**
MERGE

**D. Proposed structure**
Standardize on single `useTheme()` that returns:
```tsx
{
    theme: Theme,        // All theme colors
    themeMode: ThemeMode, // 'light' | 'dark'
    tokens: DesignTokens  // Semantic tokens
}
```

Deprecate or remove other variants.

---

## 3. Fake or Harmful Abstractions

### FINDING-012: Box/Stack Components

**A. Files involved**
- `src/components/core/Box.tsx`
- `src/components/core/Stack.tsx`

**B. What is wrong**
These layout primitives are thin wrappers around View with style props. They:
- Add abstraction overhead for simple layouts
- Aren't consistently used (most code uses inline View with StyleSheet)
- Create a second way to do styling

Evidence: AccountsListView.tsx uses Box in only 2 places but uses View + StyleSheet everywhere else.

**C. Action**
DELETE

**D. Proposed structure**
Remove Box and Stack. Use View + StyleSheet consistently. The Spacing constants already provide the design system values.

**E. Minimal example**

Before:
```tsx
<Box direction="row" align="center" gap="sm">
    <AppText>...</AppText>
</Box>
```

After:
```tsx
<View style={styles.row}>
    <AppText>...</AppText>
</View>

// styles
row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
}
```

---

### FINDING-013: ScreenHeader vs NavigationBar

**A. Files involved**
- `src/components/layout/ScreenHeader.tsx`
- `src/components/layout/NavigationBar.tsx`

**B. What is wrong**
Two header components exist:
- `NavigationBar` - Used inside Screen, handles back button + title + actions
- `ScreenHeader` - Standalone header with title + actions

They serve similar purposes but NavigationBar is the one actually used in Screen.tsx. ScreenHeader appears unused or used in limited contexts.

**C. Action**
DELETE

**D. Proposed structure**
Remove `ScreenHeader`. Use `NavigationBar` consistently. If different layout needed, compose with `Screen` props.

---

### FINDING-014: Section Component Underutilized

**A. Files involved**
- `src/components/layout/Section.tsx`

**B. What is wrong**
Section component exists but isn't used. SettingsView manually implements section padding and styling. This suggests:
- Component wasn't adopted
- Pattern isn't natural to the codebase
- Over-abstraction for simple View with padding

**C. Action**
DELETE

**D. Proposed structure**
Remove Section component. Use View + StyleSheet with Spacing constants directly.

---

## 4. Smart/Dumb Separation Issues

### FINDING-015: DateRangePicker Mixes Logic and Presentation

**A. Files involved**
- `src/components/common/DateRangePicker.tsx`

**B. What is wrong**
357-line component with:
- Local state management (view, draftFilter, customRange)
- Complex render methods (renderDatePicker, renderMenu)
- Internal components (Section, RangeChip)

This component both manages state AND renders UI.

**C. Action**
SPLIT

**D. Proposed structure**
Split into:
1. `DateRangePicker` - Dumb component, receives all props
2. `DateRangePickerContainer` - Smart wrapper, uses `useDateRangePicker`

**E. Minimal example**

Before:
```tsx
export function DateRangePicker({ visible, onClose, onSelect, currentFilter }) {
    const { view, setView, ... } = useDateRangePicker(...);
    // 350+ lines of render logic
}
```

After:
```tsx
// Container
export function DateRangePicker({ visible, onClose, onSelect, currentFilter }) {
    const props = useDateRangePicker({ visible, currentFilter, onSelect, onClose });
    return <DateRangePickerView {...props} />;
}

// View
function DateRangePickerView({ view, setView, ... }) {
    // Pure render logic
}
```

---

### FINDING-016: FilterToolbar Manages Internal State

**A. Files involved**
- `src/components/common/FilterToolbar.tsx:42-47`

**B. What is wrong**
FilterToolbar manages `isInternalExpanded` state for search expansion. This is UI state that could be:
- Fully controlled (parent manages expanded state)
- Fully uncontrolled (component manages internally, no callbacks)

Currently it's mixed - parent gets `onSearchExpandChange` but doesn't control the state.

**C. Action**
SPLIT

**D. Proposed structure**
Make it fully controlled OR fully uncontrolled:

Option A (Controlled):
```tsx
interface FilterToolbarProps {
    isSearchExpanded: boolean;
    onSearchExpandChange: (expanded: boolean) => void;
}
```

Option B (Uncontrolled):
```tsx
interface FilterToolbarProps {
    onSearchExpandChange?: (expanded: boolean) => void; // Optional callback only
}
```

---

## 5. Recommendations Summary

### High Priority
1. **FINDING-002**: Remove theme from ViewModel interfaces - Views should call `useTheme()`
2. **FINDING-012**: Delete Box/Stack components - Use View + StyleSheet
3. **FINDING-015**: Split DateRangePicker into Container/View

### Medium Priority
4. **FINDING-001**: Replace custom date filter button with DateRangeFilter component
5. **FINDING-003**: Centralize loading states with LoadingView component
6. **FINDING-004**: Use EmptyStateView consistently
7. **FINDING-009**: Merge date range hooks
8. **FINDING-011**: Standardize on single useTheme hook

### Low Priority
9. **FINDING-005**: Extract HeaderActions component
10. **FINDING-006**: Use Divider component in Settings
11. **FINDING-007**: Split DashboardHeader
12. **FINDING-008**: Simplify JournalListView interface
13. **FINDING-010**: Extract AccountCard component
14. **FINDING-013**: Remove ScreenHeader
15. **FINDING-014**: Remove Section component
16. **FINDING-016**: Clarify FilterToolbar control pattern

---

## Positive Patterns to Preserve

1. **Screen/ViewModel/View separation** - Excellent adherence to architecture rules
2. **Core component library** - AppText, AppCard, AppButton, etc. are well-designed
3. **StyleSheet per component** - All components define local styles
4. **Type-safe ViewModels** - Explicit interfaces for all ViewModels
5. **Hooks organization** - Feature-specific hooks in feature folders
6. **Reusable TransactionCard** - Good abstraction for list items
7. **DateRangeFilter/DateRangePicker composition** - Clean separation of concerns

---

## Conclusion

The codebase is well-architected overall. The main issues are:
- Minor inconsistencies in theme access patterns
- Some unused/abandoned abstractions (Box, Stack, Section, ScreenHeader)
- A few components that mix logic and presentation (DateRangePicker, FilterToolbar)

No critical violations found. The recommended changes will reduce entropy by:
- Consolidating duplicate patterns (loading, empty states, date filtering)
- Removing unused abstractions
- Standardizing on single patterns (theme access, layout)
