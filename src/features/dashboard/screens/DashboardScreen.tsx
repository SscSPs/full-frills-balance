/**
 * Dashboard Screen - Main entry point for the dashboard tab
 * 
 * This is the orchestrator for the dashboard experience:
 * - Owns FAB (floating action button)
 * - Owns DateRangePicker modal
 * - Uses useSummary, useDateRangeFilter, useJournals hooks
 * - Composes DashboardHeader + JournalList together
 */
import { DateRangePicker } from '@/src/components/common/DateRangePicker';
import { MemoizedJournalCard } from '@/src/components/common/JournalCard';
import { AppText, FloatingActionButton } from '@/src/components/core';
import { Screen } from '@/src/components/layout';
import { Spacing } from '@/src/constants';
import { useUI } from '@/src/contexts/UIContext';
import { DashboardHeader } from '@/src/features/dashboard/components/DashboardHeader';
import { useJournals } from '@/src/features/journal/hooks/useJournals';
import { useTheme } from '@/src/hooks/use-theme';
import { useDateRangeFilter } from '@/src/hooks/useDateRangeFilter';
import { useSummary } from '@/src/hooks/useSummary';
import { EnrichedJournal } from '@/src/types/domain';
import { DateRange, PeriodFilter } from '@/src/utils/dateUtils';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function DashboardScreen() {
    const router = useRouter();
    const { userName, hasCompletedOnboarding, isInitialized } = useUI();
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

    // Data hooks
    const { journals, isLoading, isLoadingMore, loadMore } = useJournals(50, dateRange || undefined);
    const { income, expense, netWorth, totalAssets, totalLiabilities, isPrivacyMode, isLoading: isSummaryLoading } = useSummary();
    const [isDashboardHidden, setIsDashboardHidden] = useState(isPrivacyMode);

    // Sync with global privacy mode when it changes
    React.useEffect(() => {
        setIsDashboardHidden(isPrivacyMode);
    }, [isPrivacyMode]);

    const handleJournalPress = useCallback((journal: EnrichedJournal) => {
        router.push(`/transaction-details?journalId=${journal.id}`);
    }, [router]);

    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
    }, []);

    const handleToggleHidden = useCallback((hidden: boolean) => {
        setIsDashboardHidden(hidden);
    }, []);

    const handleAddPress = useCallback(() => {
        router.push('/journal-entry' as any);
    }, [router]);

    const handleDateSelect = useCallback((range: DateRange | null, filter: PeriodFilter) => {
        setFilter(range, filter);
        hideDatePicker();
    }, [hideDatePicker, setFilter]);

    const greeting = useMemo(() => `Hello, ${userName || 'there'}!`, [userName]);

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
                    No transactions yet
                </AppText>
                <AppText
                    variant="body"
                    color="secondary"
                    style={styles.emptySubtext}
                >
                    Tap the + button to add your first transaction
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

    const renderItem = useCallback(({ item }: { item: EnrichedJournal }) => (
        <MemoizedJournalCard
            journal={item}
            onPress={handleJournalPress}
        />
    ), [handleJournalPress]);

    const keyExtractor = useCallback((item: EnrichedJournal) => item.id, []);

    // Show loading while initializing
    if (!isInitialized) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // Bail if onboarding not complete (routing handles redirect)
    if (!hasCompletedOnboarding) {
        return null;
    }

    return (
        <Screen showBack={false}>
            <TypedFlashList
                data={filteredJournals}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                estimatedItemSize={120}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <DashboardHeader
                        greeting={greeting}
                        netWorth={netWorth}
                        totalAssets={totalAssets}
                        totalLiabilities={totalLiabilities}
                        isSummaryLoading={isSummaryLoading}
                        isDashboardHidden={isDashboardHidden}
                        onToggleHidden={handleToggleHidden}
                        income={income}
                        expense={expense}
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                        dateRange={dateRange}
                        showDatePicker={showDatePicker}
                        navigatePrevious={navigatePrevious}
                        navigateNext={navigateNext}
                    />
                }
                ListEmptyComponent={ListEmpty}
                ListFooterComponent={ListFooter}
                onEndReached={!searchQuery ? loadMore : undefined}
                onEndReachedThreshold={0.5}
            />
            <FloatingActionButton
                onPress={handleAddPress}
            />
            <DateRangePicker
                visible={isDatePickerVisible}
                onClose={hideDatePicker}
                currentFilter={periodFilter}
                onSelect={handleDateSelect}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: Spacing.lg,
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
