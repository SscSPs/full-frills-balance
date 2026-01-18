import { AppConfig, Palette, Shape, Spacing, ThemeMode, useThemeColors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppCard, AppText } from '../core';

interface NetWorthCardProps {
    amount: number;
    isPrivacyMode: boolean;
    onTogglePrivacy: () => void;
    themeMode: ThemeMode;
}

export const NetWorthCard = ({ amount, isPrivacyMode, onTogglePrivacy, themeMode }: NetWorthCardProps) => {
    const theme = useThemeColors(themeMode);
    const formattedAmount = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const displayAmount = isPrivacyMode ? '••••••' : `${formattedAmount} ${AppConfig.defaultCurrency}`;

    return (
        <AppCard
            elevation="sm"
            style={styles.container}
            themeMode={themeMode}
        >
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: Palette.ivy }]}>
                    <Ionicons name="wallet" size={24} color="#FFFFFF" />
                </View>
                <AppText variant="caption" color="secondary" themeMode={themeMode} weight="medium">
                    NET WORTH
                </AppText>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={onTogglePrivacy} style={styles.privacyToggle}>
                    <Ionicons
                        name={isPrivacyMode ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={theme.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.balanceContainer}>
                <AppText variant="title" themeMode={themeMode} style={styles.balanceText}>
                    {displayAmount}
                </AppText>
            </View>
        </AppCard>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderRadius: Shape.radius.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    privacyToggle: {
        padding: Spacing.xs,
    },
    balanceContainer: {
        marginTop: Spacing.xs,
    },
    balanceText: {
        fontSize: 28,
        letterSpacing: -0.5,
    },
});
