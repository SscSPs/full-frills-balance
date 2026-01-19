import { AppCard, AppText, Badge, IvyIcon } from '@/components/core';
import { Shape, Spacing } from '@/constants';
import { useTheme } from '@/hooks/use-theme';
import Journal from '@/src/data/models/Journal';
import { JournalDisplayType, JournalPresenter } from '@/src/domain/accounting/JournalPresenter';
import { CurrencyFormatter } from '@/src/utils/currencyFormatter';
import { formatShortDate } from '@/src/utils/dateUtils';
import { preferences } from '@/src/utils/preferences';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface JournalCardProps {
    journal: Journal;
    onPress: (journal: Journal) => void;
}

/**
 * JournalCard - High-fidelity card for journal entries
 * Inspired by Ivy Wallet's TransactionCard
 */
export const JournalCard = ({ journal, onPress }: JournalCardProps) => {
    const { theme } = useTheme();
    const formattedDate = formatShortDate(journal.journalDate);

    // Use denormalized fields
    const totalAmount = journal.totalAmount || 0;
    const count = journal.transactionCount || 0;
    const displayType = (journal.displayType as JournalDisplayType) || JournalDisplayType.MIXED;

    const presentation = JournalPresenter.getPresentation(displayType, theme);
    const typeColor = presentation.colorHex;
    const typeLabel = JournalPresenter.getIconLabel(displayType);

    return (
        <AppCard
            elevation="sm"
            style={styles.container}
        >
            <TouchableOpacity onPress={() => onPress(journal)} style={styles.content}>
                {/* Header: Date & Count */}
                <View style={styles.header}>
                    <View style={styles.badgeRow}>
                        {journal.currencyCode !== (preferences.defaultCurrencyCode || 'USD') && (
                            <Badge variant="default" size="sm">
                                {journal.currencyCode}
                            </Badge>
                        )}
                        <Badge variant="default" size="sm">
                            {count} {count === 1 ? 'entry' : 'entries'}
                        </Badge>
                    </View>
                    <View style={{ flex: 1 }} />
                    <AppText variant="caption" color="secondary">
                        {formattedDate}
                    </AppText>
                </View>

                {/* Title / Description */}
                <View style={styles.titleSection}>
                    <AppText variant="heading" numberOfLines={1}>
                        {journal.description || 'Transaction'}
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
                        <AppText variant="xl" style={styles.amountText}>
                            {CurrencyFormatter.format(totalAmount, journal.currencyCode)}
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
        borderRadius: Shape.radius.xl,
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
