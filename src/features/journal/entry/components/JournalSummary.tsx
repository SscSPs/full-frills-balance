import { AppCard, AppText } from '@/src/components/core';
import { Spacing } from '@/src/constants';
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
                    Summary
                </AppText>

                <View style={{ gap: Spacing.sm }}>
                    <View style={styles.summaryRow}>
                        <AppText variant="body">Total Debits:</AppText>
                        <AppText variant="body">{totalDebits.toFixed(2)} {currency}</AppText>
                    </View>

                    <View style={styles.summaryRow}>
                        <AppText variant="body">Total Credits:</AppText>
                        <AppText variant="body">{totalCredits.toFixed(2)} {currency}</AppText>
                    </View>
                </View>

                <View style={[styles.summaryRow, styles.balanceRow, { borderTopColor: theme.divider }]}>
                    <AppText variant="heading">Balance:</AppText>
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
                    {isBalanced ? `✓ Journal is balanced in ${currency}` : `✗ Journal must be balanced in ${currency}`}
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
