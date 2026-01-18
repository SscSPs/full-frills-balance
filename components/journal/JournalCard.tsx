import { AppCard, AppText, Badge } from '@/components/core';
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
                    <Badge variant="default" size="sm" themeMode={themeMode}>
                        {journal.currencyCode}
                    </Badge>
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
                    {/* Circular Type Icon */}
                    <View style={[styles.typeIcon, { backgroundColor: typeColor }]}>
                        <AppText style={styles.typeIconLabel}>{typeLabel}</AppText>
                    </View>

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
    typeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    typeIconLabel: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    amountInfo: {
        flex: 1,
    },
    amountText: {
        fontWeight: 'bold',
    },
});
