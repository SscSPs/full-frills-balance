/**
 * JournalListScreen - Standalone journal list page
 * 
 * Used for viewing journal history without dashboard widgets.
 * Typically accessed from account details to view filtered transactions.
 * 
 * For the main dashboard experience, see DashboardScreen.
 */
import { DateRangeFilter } from '@/src/components/common/DateRangeFilter';
import { DateRangePicker } from '@/src/components/common/DateRangePicker';
import { AppText, ExpandableSearchButton } from '@/src/components/core';
import { Screen } from '@/src/components/layout';
import { Spacing } from '@/src/constants';
import { JournalCard } from '@/src/features/journal/components/JournalCard';
import { useJournals } from '@/src/features/journal/hooks/useJournals';
import { useTheme } from '@/src/hooks/use-theme';
import { useDateRangeFilter } from '@/src/hooks/useDateRangeFilter';
import { EnrichedJournal } from '@/src/types/domain';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export function JournalListScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    // Date range filter state
    const {
        dateRange,
        periodFilter,
        isPickerVisible: isDatePickerVisible,
        showPicker: showDatePicker,
        hidePicker: hideDatePicker,
        setFilter,
        navigatePrevious,
        navigateNext,
    } = useDateRangeFilter({ defaultToCurrentMonth: true });

    const { journals, isLoading, isLoadingMore, loadMore } = useJournals(50, dateRange || undefined);

    const handleJournalPress = useCallback((journal: EnrichedJournal) => {
        router.push(`/transaction-details?journalId=${journal.id}`);
    }, [router]);

    // Filter journals based on search query
    const filteredJournals = useMemo(() => {
        if (!searchQuery) return journals;
        const q = searchQuery.toLowerCase();
        return journals.filter(j =>
            (j.description?.toLowerCase() || '').includes(q) ||
            (j.currencyCode.toLowerCase()).includes(q)
        );
    }, [journals, searchQuery]);

    // WORKAROUND: FlashList 2.0.2 types are currently incompatible with React 19/RN 0.81 JSX checks.
    const TypedFlashList = FlashList as any;

    const ListHeader = useMemo(() => (
        <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
                <AppText variant="subheading">
                    {searchQuery ? 'Search Results' : 'Transactions'}
                </AppText>
                <View style={styles.headerActions}>
                    <DateRangeFilter
                        range={dateRange}
                        onPress={showDatePicker}
                        onPrevious={navigatePrevious}
                        onNext={navigateNext}
                        showNavigationArrows={false}
                    />
                    <ExpandableSearchButton
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search..."
                    />
                </View>
            </View>
        </View>
    ), [dateRange, searchQuery, showDatePicker, navigatePrevious, navigateNext]);

    const ListEmpty = useMemo(() => (
        isLoading ? (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" />
                <AppText variant="body" color="secondary" style={{ marginTop: Spacing.sm }}>
                    Loading journals...
                </AppText>
            </View>
        ) : (
            <View style={styles.emptyContainer}>
                <AppText variant="heading" style={styles.emptyText}>
                    No transactions found
                </AppText>
                <AppText
                    variant="body"
                    color="secondary"
                    style={styles.emptySubtext}
                >
                    Try adjusting your search or date filter
                </AppText>
            </View>
        )
    ), [isLoading]);

    const ListFooter = useMemo(() => (
        isLoadingMore ? (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" />
                <AppText variant="caption" color="secondary">
                    Loading more...
                </AppText>
            </View>
        ) : null
    ), [isLoadingMore]);

    return (
        <Screen title="Transactions">
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <TypedFlashList
                    data={filteredJournals}
                    renderItem={({ item }: { item: EnrichedJournal }) => (
                        <JournalCard
                            journal={item}
                            onPress={handleJournalPress}
                        />
                    )}
                    keyExtractor={(item: EnrichedJournal) => item.id}
                    estimatedItemSize={120}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={ListHeader}
                    ListEmptyComponent={ListEmpty}
                    ListFooterComponent={ListFooter}
                    onEndReached={!searchQuery ? loadMore : undefined}
                    onEndReachedThreshold={0.5}
                />
                <DateRangePicker
                    visible={isDatePickerVisible}
                    onClose={hideDatePicker}
                    currentFilter={periodFilter}
                    onSelect={(range, filter) => {
                        setFilter(range, filter);
                        hideDatePicker();
                    }}
                />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: Spacing.lg,
    },
    headerContainer: {
        marginBottom: Spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: Spacing.xxxxl * 2,
    },
    emptyText: {
        marginBottom: Spacing.sm,
    },
    emptySubtext: {
        textAlign: 'center',
    },
    loadingMore: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        gap: Spacing.sm,
    },
});
