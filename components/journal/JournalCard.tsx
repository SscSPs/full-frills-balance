import { AppCard, AppText, Badge, IvyIcon } from '@/components/core';
import { Shape, Spacing, ThemeMode, useThemeColors } from '@/constants';
import { useJournalTransactions } from '@/hooks/use-data';
import Journal from '@/src/data/models/Journal';
import { TransactionType } from '@/src/data/models/Transaction';
import { formatShortDate } from '@/src/utils/dateUtils';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface JournalCardProps {
    journal: Journal;
    themeMode: ThemeMode;
    onPress: (journal: Journal) => void;
}

/**
 * JournalCard - High-fidelity card for journal entries
 * Inspired by Ivy Wallet's TransactionCard
 */
export const JournalCard = ({ journal, themeMode, onPress }: JournalCardProps) => {
    const { transactions, isLoading } = useJournalTransactions(journal.id);
    const theme = useThemeColors(themeMode);

    const formattedDate = formatShortDate(journal.journalDate);

    // Derive totals
    const debits = transactions.filter(tx => tx.transactionType === TransactionType.DEBIT);
    const credits = transactions.filter(tx => tx.transactionType === TransactionType.CREDIT);

    const totalAmount = debits.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // Determine primary "type" of journal for coloring the icon
    // In a real Ivy recreation, we'd have a circular icon with a gradient
    let typeColor = theme.primary;
    let typeLabel = 'TR';

    if (credits.length === 1 && debits.length === 1) {
        typeColor = theme.transfer;
        typeLabel = '⇄';
    } else if (credits.length > 0 && debits.length > 0) {
        typeColor = theme.primary; // Generic journal
        typeLabel = 'J';
    } else if (debits.length > 0) {
        typeColor = theme.income;
        typeLabel = '+';
    } else if (credits.length > 0) {
        typeColor = theme.expense;
        typeLabel = '−';
    }

    return (
        <AppCard
            elevation="sm"
            style={styles.container}
            themeMode={themeMode}
        >
            <TouchableOpacity onPress={() => onPress(journal)} style={styles.content}>
                {/* Header: Badges & Account Info */}
                <View style={styles.header}>
                    <View style={styles.badgeRow}>
                        {journal.currencyCode !== 'USD' && (
                            <Badge variant="default" size="sm" themeMode={themeMode}>
                                {journal.currencyCode}
                            </Badge>
                        )}
                        {/* Display account names involved */}
                        {transactions.slice(0, 2).map((tx, idx) => (
                            <Badge key={tx.id} variant={tx.transactionType === TransactionType.DEBIT ? 'expense' : 'income'} size="sm" themeMode={themeMode}>
                                {tx.accountName || 'Unknown'}
                            </Badge>
                        ))}
                        {transactions.length > 2 && (
                            <AppText variant="caption" color="secondary" themeMode={themeMode}>
                                +{transactions.length - 2}
                            </AppText>
                        )}
                    </View>
                    <View style={{ flex: 1 }} />
                    <AppText variant="caption" color="secondary" themeMode={themeMode}>
                        {formattedDate}
                    </AppText>
                </View>

                {/* Title / Description */}
                <View style={styles.titleSection}>
                    <AppText variant="heading" themeMode={themeMode} numberOfLines={1}>
                        {journal.description || 'Journal Entry'}
                    </AppText>
                </View>

                {/* Amount Row: Ivy Style */}
                <View style={styles.amountRow}>
                    <IvyIcon
                        label={typeLabel}
                        color={typeColor}
                        size={40}
                        style={{ marginRight: Spacing.md }}
                    />

                    <View style={styles.amountInfo}>
                        <AppText variant="xl" themeMode={themeMode} style={styles.amountText}>
                            {isLoading ? '...' : totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <AppText variant="body" color="secondary" themeMode={themeMode}> {journal.currencyCode}</AppText>
                        </AppText>
                        <AppText variant="caption" color="secondary" themeMode={themeMode}>
                            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                        </AppText>
                    </View>
                </View>
            </TouchableOpacity>
        </AppCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
        borderRadius: Shape.radius.xl, // Ivy uses larger radius
        overflow: 'hidden',
    },
    content: {
        padding: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    titleSection: {
        marginBottom: Spacing.lg,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        flex: 1,
        flexWrap: 'wrap',
    },
    amountInfo: {
        flex: 1,
    },
    amountText: {
        fontWeight: 'bold',
    },
});
