import { AppConfig, Spacing } from '@/constants';
import { useTheme } from '@/hooks/use-theme';
import { preferences } from '@/src/utils/preferences';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppCard, AppText } from '../core';

interface DashboardSummaryProps {
    income: number;
    expense: number;
    isPrivacyMode: boolean;
}

export const DashboardSummary = ({ income, expense, isPrivacyMode }: DashboardSummaryProps) => {
    const { theme } = useTheme();

    const formatValue = (val: number) => {
        if (isPrivacyMode) return '••••';
        const currency = preferences.defaultCurrencyCode || AppConfig.defaultCurrency;
        return `${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;
    };

    return (
        <View style={styles.container}>
            {/* Income Column */}
            <AppCard elevation="sm" padding="md" style={styles.column}>
                <View style={styles.row}>
                    <View style={[styles.iconBox, { backgroundColor: theme.income + '20' }]}>
                        <Ionicons name="arrow-down-outline" size={16} color={theme.income} />
                    </View>
                    <AppText variant="caption" color="secondary">INCOME</AppText>
                </View>
                <AppText variant="subheading" style={[styles.value, { color: theme.income }]}>
                    {formatValue(income)}
                </AppText>
            </AppCard>

            {/* Expense Column */}
            <AppCard elevation="sm" padding="md" style={styles.column}>
                <View style={styles.row}>
                    <View style={[styles.iconBox, { backgroundColor: theme.expense + '20' }]}>
                        <Ionicons name="arrow-up-outline" size={16} color={theme.expense} />
                    </View>
                    <AppText variant="caption" color="secondary">EXPENSE</AppText>
                </View>
                <AppText variant="subheading" style={[styles.value, { color: theme.expense }]}>
                    {formatValue(expense)}
                </AppText>
            </AppCard>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    column: {
        flex: 1,
        // padding handled by AppCard
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    iconBox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    value: {
        fontWeight: 'bold',
    },
});
