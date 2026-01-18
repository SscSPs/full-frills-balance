import { AppCard, AppText, Badge } from '@/components/core';
import { Shape, Spacing, ThemeMode, useThemeColors } from '@/constants';
import { TransactionType } from '@/src/data/models/Transaction';
import { TransactionWithAccountInfo } from '@/src/types/readModels';
import { formatDate } from '@/src/utils/dateUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface TransactionItemProps {
    transaction: TransactionWithAccountInfo;
    themeMode: ThemeMode;
}

/**
 * TransactionItem - Premium row component for individual transactions
 * Inspired by Ivy Wallet's list items
 */
export const TransactionItem = ({ transaction, themeMode }: TransactionItemProps) => {
    const theme = useThemeColors(themeMode);

    const formattedDate = formatDate(transaction.transactionDate, { includeTime: true });
    const formattedAmount = transaction.amount ? Math.abs(transaction.amount).toFixed(2) : '0.00';
    const formattedRunningBalance = transaction.runningBalance !== undefined && transaction.runningBalance !== null
        ? transaction.runningBalance.toFixed(2)
        : null;

    const isDebit = transaction.transactionType === TransactionType.DEBIT;
    const typeColor = isDebit ? theme.expense : theme.income;
    const typeLabel = isDebit ? '−' : '+';

    return (
        <AppCard
            elevation="none"
            style={[styles.container, { backgroundColor: theme.surface }]}
            themeMode={themeMode}
        >
            <View style={styles.row}>
                {/* Status Circle */}
                <View style={[styles.statusCircle, { backgroundColor: typeColor }]}>
                    <AppText style={styles.statusLabel}>{typeLabel}</AppText>
                </View>

                <View style={styles.mainInfo}>
                    <View style={styles.headerRow}>
                        <AppText variant="body" themeMode={themeMode} style={styles.accountName}>
                            {transaction.accountName}
                        </AppText>
                        <Badge variant={isDebit ? 'expense' : 'income'} size="sm" themeMode={themeMode}>
                            {transaction.accountType}
                        </Badge>
                    </View>

                    <AppText variant="caption" color="secondary" themeMode={themeMode}>
                        {formattedDate}
                    </AppText>
                </View>

                <View style={styles.amountInfo}>
                    <AppText
                        variant="body"
                        themeMode={themeMode}
                        style={[styles.amountText, { color: typeColor }]}
                    >
                        {isDebit ? '−' : '+'} {formattedAmount}
                    </AppText>
                    {formattedRunningBalance && (
                        <AppText variant="caption" color="tertiary" themeMode={themeMode}>
                            Bal: {formattedRunningBalance}
                        </AppText>
                    )}
                </View>
            </View>

            {transaction.notes && (
                <View style={styles.notesSection}>
                    <AppText variant="caption" color="secondary" italic themeMode={themeMode}>
                        {transaction.notes}
                    </AppText>
                </View>
            )}
        </AppCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.sm,
        borderRadius: Shape.radius.lg,
        padding: Spacing.md,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    statusLabel: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    mainInfo: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    accountName: {
        fontWeight: '600',
        marginRight: Spacing.sm,
    },
    amountInfo: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    notesSection: {
        marginTop: Spacing.sm,
        paddingLeft: 40, // Match status circle + margin
    },
});
