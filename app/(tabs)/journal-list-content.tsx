import { AppText, FloatingActionButton, SearchField } from '@/components/core';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { DashboardSummary } from '@/components/journal/DashboardSummary';
import { JournalCard } from '@/components/journal/JournalCard';
import { Spacing } from '@/constants'; // Removed useThemeColors
import { useUI } from '@/contexts/UIContext'; // Changed useUser to useUI
import { useJournals, useNetWorth } from '@/hooks/use-data';
import { useSummary } from '@/hooks/use-summary';
import { useTheme } from '@/hooks/use-theme'; // Added useTheme, removed useColorScheme
import Journal from '@/src/data/models/Journal';
import { FlashList } from '@shopify/flash-list';
import { usePathname, useRouter } from 'expo-router'; // Added usePathname
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function JournalListScreen() {
  const router = useRouter()
  const pathname = usePathname(); // Added for navigation stability
  const { userName } = useUI() // Changed from themePreference, systemColorScheme, useUser
  const { theme, themeMode } = useTheme(); // Replaced themePreference, systemColorScheme, useThemeColors
  const { journals, isLoading, isLoadingMore, hasMore, loadMore } = useJournals()
  const { income, expense, isPrivacyMode } = useSummary()
  const { netWorth, totalAssets, totalLiabilities, isLoading: worthLoading } = useNetWorth()
  const [searchQuery, setSearchQuery] = React.useState('')
  // WORKAROUND: FlashList 2.0.2 types are currently incompatible with React 19/RN 0.81 JSX checks.
  // We use 'any' here to unblock the build while keeping the core logic intact.
  const TypedFlashList = FlashList as any

  const handleJournalPress = (journal: Journal) => {
    router.push(`/transaction-details?journalId=${journal.id}` as any);
  }

  // Filter journals based on search query
  const filteredJournals = journals.filter(j => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (j.description?.toLowerCase() || '').includes(q) ||
      (j.currencyCode.toLowerCase()).includes(q)
    );
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <AppText variant="body" themeMode={themeMode}>Loading journals...</AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TypedFlashList
        data={filteredJournals}
        renderItem={({ item }: { item: Journal }) => (
          <JournalCard
            journal={item}
            themeMode={themeMode}
            onPress={handleJournalPress}
          />
        )}
        keyExtractor={(item: Journal) => item.id}
        estimatedItemSize={120}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={{ marginBottom: Spacing.lg }}>
              <AppText variant="title" themeMode={themeMode}>
                Hello, {userName || 'there'}!
              </AppText>
              <AppText variant="body" color="secondary" themeMode={themeMode}>
                Here's your financial overview
              </AppText>
            </View>
            <NetWorthCard
              netWorth={netWorth}
              totalAssets={totalAssets}
              totalLiabilities={totalLiabilities}
              themeMode={themeMode}
              isLoading={worthLoading}
            />
            <DashboardSummary
              income={income}
              expense={expense}
              isPrivacyMode={isPrivacyMode}
              themeMode={themeMode}
            />
            <SearchField
              value={searchQuery}
              onChangeText={setSearchQuery}
              themeMode={themeMode}
            />
            <AppText variant="subheading" themeMode={themeMode} style={styles.sectionTitle}>
              {searchQuery ? 'Search Results' : 'Recent Transactions'}
            </AppText>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppText variant="heading" themeMode={themeMode} style={styles.emptyText}>
              No transactions yet
            </AppText>
            <AppText
              variant="body"
              color="secondary"
              themeMode={themeMode}
              style={styles.emptySubtext}
            >
              Tap the + button to add your first transaction
            </AppText>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" />
              <AppText variant="caption" color="secondary" themeMode={themeMode}>
                Loading more...
              </AppText>
            </View>
          ) : null
        }
        onEndReached={!searchQuery ? loadMore : undefined}
        onEndReachedThreshold={0.5}
      />
      <FloatingActionButton
        onPress={() => router.push('/journal-entry' as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  listContent: {
    padding: 16,
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
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
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