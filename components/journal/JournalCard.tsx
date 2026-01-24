import { AppCard, AppText, Badge } from '@/components/core';
import { Spacing, withOpacity } from '@/constants';
import { EnrichedJournal } from '@/hooks/use-data';
import { useTheme } from '@/hooks/use-theme';
import { JournalDisplayType, JournalPresenter } from '@/src/domain/accounting/JournalPresenter';
import { CurrencyFormatter } from '@/src/utils/currencyFormatter';
import { formatShortDate } from '@/src/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface JournalCardProps {
    journal: EnrichedJournal;
    onPress: (journal: EnrichedJournal) => void;
}

/**
 * JournalCard - High-fidelity card for journal entries
 * Inspired by Ivy Wallet's TransactionCard
 */
export const JournalCard = ({ journal, onPress }: JournalCardProps) => {
    const { theme } = useTheme();
    const formattedDate = formatShortDate(journal.journalDate);

    const totalAmount = journal.totalAmount || 0;
    const displayType = (journal.displayType as JournalDisplayType) || JournalDisplayType.MIXED;

    const presentation = JournalPresenter.getPresentation(displayType, theme);

    // Determine icon based on display type
    let typeIcon: keyof typeof Ionicons.glyphMap = 'document-text';
    if (displayType === JournalDisplayType.INCOME) typeIcon = 'arrow-up';
    else if (displayType === JournalDisplayType.EXPENSE) typeIcon = 'arrow-down';
    else if (displayType === JournalDisplayType.TRANSFER) typeIcon = 'swap-horizontal';

    const typeColor = presentation.colorHex;

    const content = (
        <View style={styles.cardContent}>
            {/* Header: Badges */}
            <View style={styles.badgeRow}>
                {journal.accounts.slice(0, 2).map((acc, index) => (
                    <Badge
                        key={acc.id}
                        variant={acc.accountType.toLowerCase() as any}
                        size="sm"
                        icon={acc.accountType === 'EXPENSE' ? 'pricetag' : 'wallet'}
                    >
                        {acc.name}
                    </Badge>
                ))}
                {journal.accounts.length > 2 && (
                    <Badge variant="default" size="sm">
                        +{journal.accounts.length - 2} more
                    </Badge>
                )}
            </View>

            {/* Content: Description */}
            <View style={styles.textSection}>
                <AppText variant="body" weight="bold" style={styles.title} numberOfLines={1}>
                    {journal.description || (displayType === JournalDisplayType.TRANSFER ? 'Transfer' : 'Transaction')}
                </AppText>
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
                        {displayType === JournalDisplayType.INCOME ? '+ ' : displayType === JournalDisplayType.EXPENSE ? '− ' : ''}
                        {CurrencyFormatter.format(totalAmount, journal.currencyCode)}
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
            <TouchableOpacity onPress={() => onPress(journal)} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
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
    date: {
        fontSize: 11,
    },
});
