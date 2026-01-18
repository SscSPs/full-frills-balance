import { AppCard, AppText, Badge, IvyIcon } from '@/components/core';
import { Shape, Spacing, ThemeMode, useThemeColors } from '@/constants';
import { useAccountBalance } from '@/hooks/use-data';
import Account from '@/src/data/models/Account';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface AccountCardProps {
    account: Account;
    themeMode: ThemeMode;
    onPress: (account: Account) => void;
}

/**
 * AccountCard - High-fidelity card for accounts
 * Inspired by Ivy Wallet's Account cards
 */
export const AccountCard = ({ account, themeMode, onPress }: AccountCardProps) => {
    const { balanceData, isLoading } = useAccountBalance(account.id);
    const theme = useThemeColors(themeMode);

    const balance = balanceData?.balance || 0;
    const transactionCount = balanceData?.transactionCount || 0;

    // Determine color based on account type
    let accountColor: string = theme.asset;
    const typeLower = account.accountType.toLowerCase();
    if (typeLower === 'liability') accountColor = theme.liability;
    if (typeLower === 'equity') accountColor = theme.equity;
    if (typeLower === 'income') accountColor = theme.income;
    if (typeLower === 'expense') accountColor = theme.expense;

    return (
        <AppCard
            elevation="sm"
            style={styles.container}
            themeMode={themeMode}
        >
            <TouchableOpacity onPress={() => onPress(account)} style={styles.content}>
                {/* Header: Status Icon & Account Name */}
                <View style={styles.header}>
                    <IvyIcon
                        label={account.name}
                        color={accountColor}
                        size={32}
                    />
                    <View style={styles.titleInfo}>
                        <AppText variant="heading" themeMode={themeMode} numberOfLines={1}>
                            {account.name}
                        </AppText>
                        <View style={styles.badgeRow}>
                            <Badge variant={typeLower as any} size="sm" themeMode={themeMode}>
                                {account.accountType}
                            </Badge>
                            <AppText variant="caption" color="secondary" themeMode={themeMode} style={styles.txCount}>
                                {transactionCount} txs
                            </AppText>
                        </View>
                    </View>

                    <View style={styles.amountInfo}>
                        <AppText variant="subheading" themeMode={themeMode} style={styles.amountText}>
                            {isLoading ? '...' : balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </AppText>
                        <AppText variant="caption" color="secondary" themeMode={themeMode}>
                            {account.currencyCode}
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
    },
    titleInfo: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    txCount: {
        marginLeft: Spacing.sm,
    },
    amountInfo: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontWeight: 'bold',
    },
});
