import { AppCard, AppText, Badge } from '@/components/core';
import { Spacing } from '@/constants';
import { withOpacity } from '@/constants/design-tokens';
import { useTheme } from '@/hooks/use-theme';
import { TransactionWithAccountInfo } from '@/src/types/readModels';
import { formatDate } from '@/src/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface TransactionItemProps {
    transaction: TransactionWithAccountInfo;
    onPress?: (transaction: TransactionWithAccountInfo) => void;
}

/**
 * TransactionItem - Premium row component for individual transactions
 * Inspired by Ivy Wallet's list items
 */
export const TransactionItem = ({ transaction, onPress }: TransactionItemProps) => {
    const { theme } = useTheme();

    const formattedDate = formatDate(transaction.transactionDate, { includeTime: true });
    const formattedAmount = transaction.amount ? Math.abs(transaction.amount).toFixed(2) : '0.00';

    // In our domain model, signs are determined by AccountType and TransactionType (DEBIT/CREDIT)
    // isIncrease is a pre-computed helper in EnrichedTransaction
    const isIncrease = transaction.isIncrease ?? false;

    // We check for "Transfer" by looking at displayTitle, counterAccountName or journalDescription
    // as TransactionType is limited to DEBIT/CREDIT in our ledger model.
    const isTransfer = transaction.journalDescription?.toUpperCase().includes('TRANSFER') || transaction.displayTitle === 'Transfer';

    // Determine icon and colors based on transaction type
    let typeIcon: keyof typeof Ionicons.glyphMap = 'arrow-down';
    let typeColor: string = theme.expense;

    if (isTransfer) {
        typeIcon = 'swap-horizontal';
        typeColor = theme.primary; // Or theme.transfer if available, but primary matches Purple/Ivy
    } else if (isIncrease) {
        typeIcon = 'arrow-up';
        typeColor = theme.income;
    }

    const content = (
        <View style={styles.cardContent}>
            {/* Header: Badges */}
            <View style={styles.badgeRow}>
                {transaction.counterAccountType && (
                    <Badge
                        variant={transaction.counterAccountType.toLowerCase() as any}
                        size="sm"
                        icon={transaction.counterAccountType === 'EXPENSE' ? 'pricetag' : 'wallet'}
                    >
                        {transaction.counterAccountName || transaction.counterAccountType}
                    </Badge>
                )}
                <Badge
                    variant={transaction.accountType.toLowerCase() as any}
                    size="sm"
                    icon="wallet"
                >
                    {transaction.accountName}
                </Badge>
            </View>

            {/* Content: Title & Notes */}
            <View style={styles.textSection}>
                <AppText variant="body" weight="bold" style={styles.title} numberOfLines={1}>
                    {transaction.displayTitle || transaction.journalDescription || 'Unnamed Transaction'}
                </AppText>

                {transaction.notes && (
                    <AppText variant="caption" color="secondary" style={styles.notes} numberOfLines={2}>
                        {transaction.notes}
                    </AppText>
                )}
            </View>

            {/* Footer: Icon + Amount + Date */}
            <View style={styles.footerRow}>
                <View style={styles.amountContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: withOpacity(typeColor, 0.2) }]}>
                        <Ionicons name={typeIcon} size={16} color={typeColor} />
                    </View>
                    <AppText
                        variant="subheading"
                        weight="bold"
                        style={{ color: typeColor }}
                    >
                        {!isTransfer && (isIncrease ? '+ ' : '− ')}
                        {formattedAmount}
                    </AppText>
                    <AppText variant="caption" color="tertiary" style={styles.currency}>
                        {transaction.currencyCode}
                    </AppText>
                </View>

                <AppText variant="caption" color="tertiary" style={styles.date}>
                    {formattedDate}
                </AppText>
            </View>
        </View>
    );

    return (
        <AppCard
            elevation="sm"
            padding="none"
            radius="r3"
            style={[styles.container, { backgroundColor: theme.surface }]}
        >
            {onPress ? (
                <TouchableOpacity onPress={() => onPress(transaction)} activeOpacity={0.7}>
                    {content}
                </TouchableOpacity>
            ) : (
                content
            )}
        </AppCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
    cardContent: {
        padding: Spacing.lg,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    textSection: {
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 16,
    },
    notes: {
        marginTop: 4,
        fontSize: 13,
        opacity: 0.8,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.xs,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    currency: {
        marginLeft: 4,
        alignSelf: 'flex-end',
        paddingBottom: 2,
    },
    date: {
        fontSize: 11,
    },
});
