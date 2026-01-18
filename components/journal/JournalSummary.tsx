import { AppCard, AppText } from '@/components/core';
import { Spacing, ThemeMode, useThemeColors } from '@/constants';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface JournalSummaryProps {
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
    themeMode: ThemeMode;
}

export function JournalSummary({
    totalDebits,
    totalCredits,
    isBalanced,
    themeMode,
}: JournalSummaryProps) {
    const theme = useThemeColors(themeMode);
    const difference = Math.abs(totalDebits - totalCredits);

    return (
        <AppCard themeMode={themeMode} style={styles.card}>
            <AppText variant="subheading" themeMode={themeMode} style={styles.title}>
                Summary
            </AppText>

            <View style={styles.summaryRow}>
                <AppText variant="body" themeMode={themeMode}>Total Debits:</AppText>
                <AppText variant="body" themeMode={themeMode}>${totalDebits.toFixed(2)}</AppText>
            </View>

            <View style={styles.summaryRow}>
                <AppText variant="body" themeMode={themeMode}>Total Credits:</AppText>
                <AppText variant="body" themeMode={themeMode}>${totalCredits.toFixed(2)}</AppText>
            </View>

            <View style={styles.summaryRow}>
                <AppText variant="heading" themeMode={themeMode}>Balance:</AppText>
                <AppText
                    variant="heading"
                    color={isBalanced ? "success" : "error"}
                    themeMode={themeMode}
                >
                    ${difference.toFixed(2)}
                </AppText>
            </View>

            <AppText
                variant="body"
                color={isBalanced ? "success" : "error"}
                themeMode={themeMode}
                style={styles.balanceText}
            >
                {isBalanced ? '✓ Journal is balanced in USD' : '✗ Journal must be balanced in USD'}
            </AppText>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    card: {
        margin: Spacing.lg,
        marginTop: Spacing.sm,
    },
    title: {
        marginBottom: Spacing.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    balanceText: {
        marginTop: Spacing.sm,
        textAlign: 'center',
        fontWeight: '600',
    },
});
