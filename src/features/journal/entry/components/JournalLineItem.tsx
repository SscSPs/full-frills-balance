import { AppInput, AppText } from '@/src/components/core';
import { AppConfig, Shape, Spacing } from '@/src/constants';
import { AccountType } from '@/src/data/models/Account';
import { TransactionType } from '@/src/data/models/Transaction';
import { useTheme } from '@/src/hooks/use-theme';
import { CurrencyFormatter } from '@/src/utils/currencyFormatter';
import { preferences } from '@/src/utils/preferences';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

// Reuse the interface for now to minimize friction, eventually move to shared types
export interface JournalEntryLine {
    id: string;
    accountId: string;
    accountName: string;
    accountType: AccountType;
    accountCurrency?: string;
    amount: string;
    amountInJournalCurrency?: number;
    transactionType: TransactionType;
    notes: string;
    exchangeRate?: string;
}

interface JournalLineItemProps {
    line: JournalEntryLine;
    index: number;
    canRemove: boolean;
    onUpdate: (field: keyof JournalEntryLine, value: any) => void;
    onRemove: () => void;
    onSelectAccount: () => void;
    onAutoFetchRate?: () => void;
    getLineBaseAmount: (line: JournalEntryLine) => number;
}

export function JournalLineItem({
    line,
    index,
    canRemove,
    onUpdate,
    onRemove,
    onSelectAccount,
    onAutoFetchRate,
    getLineBaseAmount,
}: JournalLineItemProps) {
    const { theme } = useTheme();

    return (
        <View
            style={{
                padding: Spacing.md,
                borderRadius: Shape.radius.r2,
                backgroundColor: theme.surfaceSecondary,
                borderWidth: 1,
                borderColor: theme.border,
                marginBottom: Spacing.md
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                <AppText variant="subheading">{AppConfig.strings.advancedEntry.lineTitle(index + 1)}</AppText>
                {canRemove && (
                    <TouchableOpacity onPress={onRemove} style={{ padding: Spacing.sm }} accessibilityLabel={AppConfig.strings.advancedEntry.removeLine} accessibilityRole="button">
                        <AppText variant="body" color="error">{AppConfig.strings.advancedEntry.removeLine}</AppText>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                style={[styles.accountSelector, {
                    backgroundColor: theme.surface,
                    borderColor: theme.border
                }]}
                onPress={onSelectAccount}
                accessibilityLabel={line.accountName || AppConfig.strings.advancedEntry.selectAccount}
                accessibilityRole="button"
            >
                <AppText variant="body">
                    {line.accountName || AppConfig.strings.advancedEntry.selectAccount}
                </AppText>
                <AppText variant="body" color="secondary">▼</AppText>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md }}>
                <View style={{ flex: 1 }}>
                    <AppText variant="body" weight="medium" style={{ marginBottom: Spacing.xs }}>Type</AppText>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                line.transactionType === TransactionType.DEBIT && { backgroundColor: theme.primary, borderColor: theme.primary },
                                { borderColor: theme.border }
                            ]}
                            onPress={() => onUpdate('transactionType', TransactionType.DEBIT)}
                            accessibilityLabel="Debit"
                            accessibilityRole="button"
                        >
                            <AppText
                                variant="body"
                                style={[
                                    line.transactionType === TransactionType.DEBIT && { color: theme.pureInverse }
                                ]}
                            >
                                {AppConfig.strings.advancedEntry.debit}
                            </AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                line.transactionType === TransactionType.CREDIT && { backgroundColor: theme.primary, borderColor: theme.primary },
                                { borderColor: theme.border }
                            ]}
                            onPress={() => onUpdate('transactionType', TransactionType.CREDIT)}
                            accessibilityLabel="Credit"
                            accessibilityRole="button"
                        >
                            <AppText
                                variant="body"
                                style={[
                                    line.transactionType === TransactionType.CREDIT && { color: theme.pureInverse }
                                ]}
                            >
                                {AppConfig.strings.advancedEntry.credit}
                            </AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
                        <AppText variant="body" weight="medium">{AppConfig.strings.transactionFlow.amount}</AppText>
                        {line.accountCurrency && (
                            <AppText variant="caption" color="primary">
                                {line.accountCurrency}
                            </AppText>
                        )}
                    </View>
                    <AppInput
                        value={line.amount}
                        onChangeText={(value) => onUpdate('amount', value)}
                        placeholder={AppConfig.strings.advancedEntry.amountPlaceholder}
                        keyboardType="numeric"
                        testID="amount-input"
                    />
                    {line.accountCurrency && line.accountCurrency !== (preferences.defaultCurrencyCode || AppConfig.defaultCurrency) && (
                        <AppText variant="caption" color="secondary" style={{ marginTop: 2 }}>
                            ≈ {CurrencyFormatter.format(getLineBaseAmount(line))}
                        </AppText>
                    )}
                </View>
            </View>

            <AppInput
                label={AppConfig.strings.advancedEntry.notes}
                value={line.notes}
                onChangeText={(value) => onUpdate('notes', value)}
                placeholder={AppConfig.strings.advancedEntry.notesPlaceholder}
                containerStyle={{ marginBottom: Spacing.md }}
            />

            <View style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
                    <AppText variant="body" weight="medium">
                        {AppConfig.strings.advancedEntry.exchangeRate}
                    </AppText>
                    {line.accountCurrency && line.accountCurrency !== (preferences.defaultCurrencyCode || AppConfig.defaultCurrency) && onAutoFetchRate && (
                        <TouchableOpacity onPress={onAutoFetchRate}>
                            <AppText variant="caption" color="primary">{AppConfig.strings.advancedEntry.autoFetch}</AppText>
                        </TouchableOpacity>
                    )}
                </View>
                <AppInput
                    value={line.exchangeRate || ''}
                    onChangeText={(value) => onUpdate('exchangeRate', value)}
                    placeholder={AppConfig.strings.advancedEntry.ratePlaceholder}
                    keyboardType="decimal-pad"
                />
                <AppText variant="caption" color="secondary" style={{ marginTop: Spacing.xs }}>
                    {line.accountCurrency === (preferences.defaultCurrencyCode || AppConfig.defaultCurrency)
                        ? AppConfig.strings.advancedEntry.rateHelpSame
                        : AppConfig.strings.advancedEntry.rateHelpConvert(line.accountCurrency || '', preferences.defaultCurrencyCode || AppConfig.defaultCurrency)}
                </AppText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    accountSelector: {
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Shape.radius.r3,
        borderWidth: 1,
        marginBottom: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    typeButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: Shape.radius.full,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        alignItems: 'center',
    },
});
