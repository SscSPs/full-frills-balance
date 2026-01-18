import { AppConfig, Spacing, ThemeMode, useThemeColors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppCard, AppText } from '../core';

interface DashboardSummaryProps {
    income: number;
    expense: number;
    isPrivacyMode: boolean;
    themeMode: ThemeMode;
}

export const DashboardSummary = ({ income, expense, isPrivacyMode, themeMode }: DashboardSummaryProps) => {
    const theme = useThemeColors(themeMode);

    const formatValue = (val: number) => {
        if (isPrivacyMode) return '••••';
        return `${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${AppConfig.defaultCurrency}`;
    };

    return (
        <View style={styles.container}>
            {/* Income Column */}
            <AppCard elevation="sm" style={styles.column} themeMode={themeMode}>
                <View style={styles.row}>
                    <View style={[styles.iconBox, { backgroundColor: theme.income + '20' }]}>
                        <Ionicons name="arrow-down-outline" size={16} color={theme.income} />
                    </View>
                    <AppText variant="caption" color="secondary" themeMode={themeMode}>INCOME</AppText>
                </View>
                <AppText variant="subheading" themeMode={themeMode} style={[styles.value, { color: theme.income }]}>
                    {formatValue(income)}
                </AppText>
            </AppCard>

            {/* Expense Column */}
            <AppCard elevation="sm" style={styles.column} themeMode={themeMode}>
                <View style={styles.row}>
                    <View style={[styles.iconBox, { backgroundColor: theme.expense + '20' }]}>
                        <Ionicons name="arrow-up-outline" size={16} color={theme.expense} />
                    </View>
                    <AppText variant="caption" color="secondary" themeMode={themeMode}>EXPENSE</AppText>
                </View>
                <AppText variant="subheading" themeMode={themeMode} style={[styles.value, { color: theme.expense }]}>
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
        padding: Spacing.md,
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
