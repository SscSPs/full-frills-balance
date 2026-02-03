/**
 * Account Details Screen
 * 
 * Shows account information and transaction history
 */

import { DateRangeFilter } from '@/src/components/common/DateRangeFilter'
import { DateRangePicker } from '@/src/components/common/DateRangePicker'
import { MemoizedTransactionItem } from '@/src/components/common/TransactionItem'
import { AppButton, AppCard, AppIcon, AppText, Badge, FloatingActionButton, IconButton, IvyIcon } from '@/src/components/core'
import { Screen } from '@/src/components/layout'
import { Shape, Spacing } from '@/src/constants'
import { useAccount, useAccountActions, useAccountBalance } from '@/src/features/accounts/hooks/useAccounts'
import { useAccountTransactions } from '@/src/features/journal/hooks/useJournals'
import { useTheme } from '@/src/hooks/use-theme'
import { useDateRangeFilter } from '@/src/hooks/useDateRangeFilter'
import { EnrichedTransaction } from '@/src/types/domain'
import { showConfirmationAlert, showErrorAlert, showSuccessAlert } from '@/src/utils/alerts'
import { CurrencyFormatter } from '@/src/utils/currencyFormatter'
import { DateRange, PeriodFilter } from '@/src/utils/dateUtils'
import { logger } from '@/src/utils/logger'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useMemo } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'

export default function AccountDetailsScreen() {
    const router = useRouter()
    const params = useLocalSearchParams()
    const { theme } = useTheme()
    const accountId = params.accountId as string

    // Date range filter state (from shared hook)
    const {
        dateRange,
        periodFilter,
        isPickerVisible: isDatePickerVisible,
        showPicker: showDatePicker,
        hidePicker: hideDatePicker,
        setFilter,
        navigatePrevious,
        navigateNext,
    } = useDateRangeFilter({ defaultToCurrentMonth: true })

    const { account, isLoading: accountLoading, version: accountVersion } = useAccount(accountId)
    const { transactions, isLoading: transactionsLoading, version: txVersion } = useAccountTransactions(accountId, 50, dateRange || undefined)
    const { balanceData, isLoading: balanceLoading, version: balanceVersion } = useAccountBalance(accountId)
    const { deleteAccount, recoverAccount: recoverAction } = useAccountActions()

    const balance = balanceData?.balance || 0
    const transactionCount = balanceData?.transactionCount || 0
    const isDeleted = (account as any)?._raw?._status === 'deleted' || (account as any)?._raw?.deleted_at != null

    const handleDelete = useCallback(() => {
        if (!account) return;
        const hasTransactions = transactionCount > 0;
        const message = hasTransactions
            ? `This account has ${transactionCount} transaction(s). Deleting it will orphan these transactions. Are you sure?`
            : 'Are you sure you want to delete this account? This action cannot be undone.';

        showConfirmationAlert(
            'Delete Account',
            message,
            async () => {
                try {
                    await deleteAccount(account);
                    showSuccessAlert('Deleted', 'Account has been deleted.');
                    router.push('/(tabs)/accounts' as any);
                } catch (error) {
                    logger.error('Failed to delete account:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    showErrorAlert(`Could not delete account: ${errorMessage}`);
                }
            }
        );
    }, [account, deleteAccount, router, transactionCount]);

    const handleRecover = useCallback(() => {
        showConfirmationAlert(
            'Recover Account',
            'This will restore the deleted account. Continue?',
            async () => {
                try {
                    await recoverAction(accountId);
                    showSuccessAlert('Recovered', 'Account has been restored.');
                    router.replace(`/account-details?accountId=${accountId}` as any);
                } catch (error) {
                    logger.error('Failed to recover account:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    showErrorAlert(`Could not recover account: ${errorMessage}`);
                }
            }
        );
    }, [accountId, recoverAction, router]);

    const handleEdit = useCallback(() => {
        router.push(`/account-creation?accountId=${accountId}` as any);
    }, [accountId, router]);

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    const handleAuditPress = useCallback(() => {
        router.push(`/audit-log?entityType=account&entityId=${accountId}` as any);
    }, [accountId, router]);

    const handleTransactionPress = useCallback((transaction: EnrichedTransaction) => {
        router.push(`/transaction-details?journalId=${transaction.journalId}` as any);
    }, [router]);

    const handleAddPress = useCallback(() => {
        router.push(`/journal-entry?sourceId=${accountId}` as any);
    }, [accountId, router]);

    const handleDateSelect = useCallback((range: DateRange | null, filter: PeriodFilter) => {
        setFilter(range, filter);
        hideDatePicker();
    }, [hideDatePicker, setFilter]);

    const headerActions = useMemo(() => (
        <View style={styles.headerActions}>
            {isDeleted ? (
                <IconButton
                    name="refresh"
                    onPress={handleRecover}
                    variant="surface"
                    iconColor={theme.income}
                />
            ) : (
                <>
                    <IconButton
                        testID="edit-button"
                        name="edit"
                        onPress={handleEdit}
                        variant="surface"
                        iconColor={theme.text}
                    />
                    <IconButton
                        testID="delete-button"
                        name="delete"
                        onPress={handleDelete}
                        variant="surface"
                        iconColor={theme.error}
                    />
                </>
            )}
        </View>
    ), [handleDelete, handleEdit, handleRecover, isDeleted, theme.error, theme.income, theme.text, accountVersion]);

    if (accountLoading) {
        return (
            <Screen title="Details">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </Screen>
        )
    }

    if (!account) {
        return (
            <Screen title="Details">
                <View style={styles.errorContainer}>
                    <AppText variant="body" color="error">
                        Account not found
                    </AppText>
                    <AppButton variant="outline" onPress={handleBack}>
                        Go Back
                    </AppButton>
                </View>
            </Screen>
        )
    }

    const listHeader = useMemo(() => (
        <View style={styles.headerListRegion}>
            {/* Account Info Card */}
            <AppCard elevation="sm" style={styles.accountInfoCard}>
                <View style={styles.accountHeader}>
                    <IvyIcon
                        label={account.name}
                        color={account.accountType.toLowerCase() === 'liability' ? theme.liability : (account.accountType.toLowerCase() === 'expense' ? theme.expense : theme.asset)}
                        size={48}
                    />
                    <View style={styles.titleInfo}>
                        <AppText variant="title">
                            {account.name}
                        </AppText>
                        <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                            <Badge variant={account.accountType.toLowerCase() as any}>
                                {account.accountType}
                            </Badge>
                            {isDeleted && (
                                <Badge variant="expense">
                                    DELETED
                                </Badge>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.accountStats}>
                    <View style={styles.statItem}>
                        <AppText variant="caption" color="secondary">
                            Current Balance
                        </AppText>
                        <AppText variant="heading">
                            {balanceLoading ? '...' : CurrencyFormatter.format(balance, account.currencyCode)}
                        </AppText>
                    </View>

                    <View style={styles.statItem}>
                        <AppText variant="caption" color="secondary">
                            Transactions
                        </AppText>
                        <AppText variant="subheading">
                            {balanceLoading ? '...' : transactionCount}
                        </AppText>
                    </View>
                </View>

                <View style={[styles.accountMeta, { borderTopWidth: 1, borderTopColor: theme.border }]}>
                    <TouchableOpacity
                        style={styles.historyLink}
                        onPress={handleAuditPress}
                    >
                        <AppText variant="caption" color="primary" weight="semibold">View Edit History</AppText>
                        <AppIcon name="chevronRight" size={14} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            </AppCard>

            {/* Transaction History Header */}
            <View style={styles.sectionHeader}>
                <AppText variant="heading">
                    Transaction History
                </AppText>
                <DateRangeFilter
                    range={dateRange}
                    onPress={showDatePicker}
                    onPrevious={navigatePrevious}
                    onNext={navigateNext}
                />
            </View>
        </View>
    ), [
        account,
        balance,
        balanceLoading,
        dateRange,
        handleAuditPress,
        isDeleted,
        navigateNext,
        navigatePrevious,
        showDatePicker,
        theme.asset,
        theme.border,
        theme.expense,
        theme.liability,
        theme.primary,
        transactionCount,
        accountVersion,
        balanceVersion,
    ]);

    const renderItem = useCallback(({ item }: { item: EnrichedTransaction }) => (
        <MemoizedTransactionItem
            transaction={item}
            onPress={handleTransactionPress}
        />
    ), [handleTransactionPress]);

    const listEmpty = useMemo(() => (
        transactionsLoading ? (
            <View style={{ padding: Spacing.lg }}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        ) : (
            <AppCard elevation="sm" padding="lg">
                <AppText variant="body" color="secondary" style={styles.emptyText}>
                    No transactions yet
                </AppText>
            </AppCard>
        )
    ), [theme.primary, transactionsLoading, txVersion]);

    const keyExtractor = useCallback((item: EnrichedTransaction) => item.id, []);

    return (
        <Screen
            title="Account Details"
            headerActions={headerActions}
        >
            <FlatList
                data={transactions}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ListHeaderComponent={listHeader}
                ListEmptyComponent={listEmpty}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />

            {!isDeleted && (
                <FloatingActionButton
                    onPress={handleAddPress}
                />
            )}

            <DateRangePicker
                visible={isDatePickerVisible}
                onClose={hideDatePicker}
                currentFilter={periodFilter}
                onSelect={handleDateSelect}
            />
        </Screen>
    )
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.lg,
        padding: Spacing.lg,
    },
    headerActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    headerListRegion: {
        paddingVertical: Spacing.md,
    },
    accountInfoCard: {
        marginBottom: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: Shape.radius.xl,
    },
    accountHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    titleInfo: {
        marginLeft: Spacing.md,
        flex: 1,
        gap: Spacing.xs,
    },
    accountStats: {
        flexDirection: 'row',
        gap: Spacing.xl,
        marginBottom: Spacing.md,
        paddingVertical: Spacing.md,
    },
    statItem: {
        flex: 1,
    },
    accountMeta: {
        gap: Spacing.xs,
        paddingTop: Spacing.md,
    },
    historyLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    emptyText: {
        textAlign: 'center',
    },
    listContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xxxxl * 2.5, // Space for FAB
    },
})
