import { AppText } from '@/components/core';
import { AppConfig, Shape, Spacing, ThemeMode, useThemeColors } from '@/constants';
import { AccountType } from '@/src/data/models/Account';
import { TransactionType } from '@/src/data/models/Transaction';
import { exchangeRateService } from '@/src/services/exchange-rate-service';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
    themeMode: ThemeMode;
    canRemove: boolean;
    onUpdate: (field: keyof JournalEntryLine, value: any) => void;
    onRemove: () => void;
    onSelectAccount: () => void;
    getLineBaseAmount: (line: JournalEntryLine) => number;
}

export function JournalLineItem({
    line,
    index,
    themeMode,
    canRemove,
    onUpdate,
    onRemove,
    onSelectAccount,
    getLineBaseAmount,
}: JournalLineItemProps) {
    const theme = useThemeColors(themeMode);

    return (
        <View style={[styles.lineContainer, {
            backgroundColor: theme.surfaceSecondary,
            borderColor: theme.border
        }]}>
            <View style={styles.lineHeader}>
                <AppText variant="subheading" themeMode={themeMode}>Line {index + 1}</AppText>
                {canRemove && (
                    <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
                        <AppText variant="body" color="error" themeMode={themeMode}>Remove</AppText>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                style={[styles.accountSelector, {
                    backgroundColor: theme.surface,
                    borderColor: theme.border
                }]}
                onPress={onSelectAccount}
            >
                <AppText variant="body" themeMode={themeMode}>
                    {line.accountName || 'Select Account'}
                </AppText>
                <AppText variant="body" color="secondary" themeMode={themeMode}>▼</AppText>
            </TouchableOpacity>

            <View style={styles.lineRow}>
                <View style={styles.halfWidth}>
                    <AppText variant="body" themeMode={themeMode} style={styles.label}>Type</AppText>
                    <View style={styles.typeButtons}>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                line.transactionType === TransactionType.DEBIT && styles.typeButtonActive,
                                line.transactionType === TransactionType.DEBIT && { backgroundColor: theme.primary },
                                { borderColor: theme.border }
                            ]}
                            onPress={() => onUpdate('transactionType', TransactionType.DEBIT)}
                        >
                            <AppText
                                variant="body"
                                themeMode={themeMode}
                                style={[
                                    line.transactionType === TransactionType.DEBIT && { color: theme.background }
                                ]}
                            >
                                DEBIT
                            </AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                line.transactionType === TransactionType.CREDIT && styles.typeButtonActive,
                                line.transactionType === TransactionType.CREDIT && { backgroundColor: theme.primary },
                                { borderColor: theme.border }
                            ]}
                            onPress={() => onUpdate('transactionType', TransactionType.CREDIT)}
                        >
                            <AppText
                                variant="body"
                                themeMode={themeMode}
                                style={[
                                    line.transactionType === TransactionType.CREDIT && { color: theme.background }
                                ]}
                            >
                                CREDIT
                            </AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.halfWidth}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <AppText variant="body" themeMode={themeMode} style={styles.label}>Amount</AppText>
                        {line.accountCurrency && (
                            <AppText variant="caption" color="primary" themeMode={themeMode}>
                                {line.accountCurrency}
                            </AppText>
                        )}
                    </View>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.text
                        }]}
                        value={line.amount}
                        onChangeText={(value) => onUpdate('amount', value)}
                        placeholder="0.00"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                    />
                    {line.accountCurrency && line.accountCurrency !== AppConfig.defaultCurrency && (
                        <AppText variant="caption" color="secondary" themeMode={themeMode}>
                            ≈ ${(getLineBaseAmount(line)).toFixed(2)} USD
                        </AppText>
                    )}
                </View>
            </View>

            <AppText variant="body" themeMode={themeMode} style={styles.label}>Notes</AppText>
            <TextInput
                style={[styles.input, {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text
                }]}
                value={line.notes}
                onChangeText={(value) => onUpdate('notes', value)}
                placeholder="Optional notes"
                placeholderTextColor={theme.textSecondary}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText variant="body" themeMode={themeMode} style={styles.label}>
                    Exchange Rate (Optional)
                </AppText>
                {line.accountCurrency && line.accountCurrency !== AppConfig.defaultCurrency && (
                    <TouchableOpacity
                        onPress={async () => {
                            try {
                                const rate = await exchangeRateService.getRate(
                                    line.accountCurrency!,
                                    AppConfig.defaultCurrency
                                )
                                onUpdate('exchangeRate', rate.toString())
                            } catch (error) {
                                console.error('Failed to fetch rate:', error)
                            }
                        }}
                    >
                        <AppText variant="caption" color="primary" themeMode={themeMode}>Auto-fetch</AppText>
                    </TouchableOpacity>
                )}
            </View>
            <TextInput
                style={[styles.input, {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text
                }]}
                value={line.exchangeRate || ''}
                onChangeText={(value) => onUpdate('exchangeRate', value)}
                placeholder="e.g., 1.1050"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
            />
            <AppText variant="caption" color="secondary" themeMode={themeMode} style={{ marginTop: -8, marginBottom: 8 }}>
                {line.accountCurrency === AppConfig.defaultCurrency
                    ? 'Not needed (same as base currency)'
                    : `Rate to convert ${line.accountCurrency} to ${AppConfig.defaultCurrency}`}
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    linesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    addButton: {
        padding: Spacing.sm,
    },
    lineContainer: {
        borderWidth: 1,
        borderRadius: Shape.radius.r2,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    lineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    removeButton: {
        padding: Spacing.sm,
    },
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
    label: {
        marginBottom: Spacing.xs,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: Shape.radius.r3,
        padding: Spacing.md,
        fontSize: 16,
        marginBottom: Spacing.md,
    },
    lineRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    halfWidth: {
        flex: 1,
    },
    typeButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    typeButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: Shape.radius.full,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        alignItems: 'center',
    },
    typeButtonActive: {
        // Handled by inline styles
    },
});
