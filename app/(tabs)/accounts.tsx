import { AppButton, AppText, FloatingActionButton } from '@/components/core'
import { NetWorthCard } from '@/components/dashboard/NetWorthCard'
import { AccountCard } from '@/components/journal/AccountCard'
import { Spacing } from '@/constants'
import { useUI } from '@/contexts/UIContext'
import { useAccounts, useNetWorth } from '@/hooks/use-data'
import { useTheme } from '@/hooks/use-theme'; // Added useTheme
import Account from '@/src/data/models/Account'
import { getAccountSections } from '@/src/utils/accountUtils'
import { usePathname, useRouter } from 'expo-router'; // Added usePathname
import React, { useMemo } from 'react'
import { SectionList, StyleSheet, View } from 'react-native'

export default function AccountsScreen() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, themeMode } = useTheme()
  const { userName } = useUI()

  const { accounts, isLoading: accountsLoading } = useAccounts()
  const { balances, netWorth, totalAssets, totalLiabilities, isLoading: worthLoading } = useNetWorth()

  const handleAccountPress = (account: Account) => {
    router.push(`/account-details?accountId=${account.id}` as any)
  }

  const handleCreateJournal = () => {
    router.push('/journal-entry' as any)
  }

  const handleViewJournals = () => {
    router.push('/(tabs)')
  }

  const handleCreateAccount = () => {
    router.push('/account-creation' as any)
  }

  // Combine accounts with their balances and group by type
  const sections = useMemo(() => {
    if (!accounts.length) return []
    return getAccountSections(accounts)
  }, [accounts])

  const renderHeader = () => (
    <View>
      <View style={[styles.headerButtons, { backgroundColor: theme.background }]}>
        <AppButton
          variant="primary"
          size="sm"
          onPress={handleCreateAccount}
          themeMode={themeMode}
          style={{ flex: 1 }}
        >
          + Account
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          onPress={handleCreateJournal}
          themeMode={themeMode}
          style={{ flex: 1 }}
        >
          + Journal
        </AppButton>
        <AppButton
          variant="outline"
          size="sm"
          onPress={handleViewJournals}
          themeMode={themeMode}
        >
          📋
        </AppButton>
      </View>

      <NetWorthCard
        netWorth={netWorth}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        themeMode={themeMode}
        isLoading={worthLoading}
      />
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SectionList
        sections={sections}
        refreshing={accountsLoading}
        onRefresh={() => { }} // Reactivity handles updates, but need prop for PullToRefresh visual
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AccountCard
            account={item}
            themeMode={themeMode}
            onPress={handleAccountPress}
            initialBalanceData={balances.find(b => b.accountId === item.id)}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <AppText
            variant="subheading"
            color="secondary"
            themeMode={themeMode}
            style={styles.sectionHeader}
          >
            {title}
          </AppText>
        )}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AppText variant="body" color="secondary" themeMode={themeMode}>
              No accounts yet. Create your first account to get started!
            </AppText>
          </View>
        }
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false}
      />

      <FloatingActionButton
        onPress={() => router.push('/journal-entry' as any)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100, // Space for FAB
  },
  sectionHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyState: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
})
