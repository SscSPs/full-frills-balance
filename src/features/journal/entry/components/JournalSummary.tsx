import { AppCard, AppText } from '@/src/components/core';
import { AppConfig, Spacing } from '@/src/constants';
import { useTheme } from '@/src/hooks/use-theme';
import { preferences } from '@/src/utils/preferences';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface JournalSummaryProps {
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
}

export function JournalSummary({
    totalDebits,
    totalCredits,
    isBalanced,
}: JournalSummaryProps) {
    const { theme } = useTheme();
    const currency = preferences.defaultCurrencyCode || 'USD';
    const difference = Math.abs(totalDebits - totalCredits);

    return (
        <AppCard style={{ marginHorizontal: Spacing.lg, marginVertical: Spacing.sm }}>
            <View style={{ gap: Spacing.md }}>
                <AppText variant="subheading">
                    {AppConfig.strings.journalSummary.title}
                </AppText>

                <View style={{ gap: Spacing.sm }}>
                    <View style={styles.summaryRow}>
                        <AppText variant="body">{AppConfig.strings.journalSummary.totalDebits}</AppText>
                        <AppText variant="body">{totalDebits.toFixed(2)} {currency}</AppText>
                    </View>

                    <View style={styles.summaryRow}>
                        <AppText variant="body">{AppConfig.strings.journalSummary.totalCredits}</AppText>
                        <AppText variant="body">{totalCredits.toFixed(2)} {currency}</AppText>
                    </View>
                </View>

                <View style={[styles.summaryRow, styles.balanceRow, { borderTopColor: theme.divider }]}>
                    <AppText variant="heading">{AppConfig.strings.journalSummary.balance}</AppText>
                    <AppText
                        variant="heading"
                        color={isBalanced ? "success" : "error"}
                    >
                        {difference.toFixed(2)} {currency}
                    </AppText>
                </View>

                <AppText
                    variant="body"
                    color={isBalanced ? "success" : "error"}
                    align="center"
                    weight="semibold"
                    style={{ marginTop: Spacing.xs }}
                >
                    {isBalanced ? AppConfig.strings.journalSummary.balanced(currency) : AppConfig.strings.journalSummary.unbalanced(currency)}
                </AppText>
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    balanceRow: {
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
    }
});
