import { DateTimePickerModal } from '@/src/components/common/DateTimePickerModal';
import { AppButton } from '@/src/components/core/AppButton';
import { AppCard } from '@/src/components/core/AppCard';
import { AppIcon } from '@/src/components/core/AppIcon';
import { AppInput } from '@/src/components/core/AppInput';
import { AppText } from '@/src/components/core/AppText';
import { AppConfig, Opacity, Shape, Size, Spacing, Typography, withOpacity } from '@/src/constants';
import Account from '@/src/data/models/Account';
import { AccountTileList } from '@/src/features/journal/components/AccountTileList';
import { useTheme } from '@/src/hooks/use-theme';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { TabType, UseSimpleJournalEditorProps, useSimpleJournalEditor } from '../hooks/useSimpleJournalEditor';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SimpleFormProps extends UseSimpleJournalEditorProps { }

/**
 * SimpleForm - Smart container that orchestrates logic via useSimpleJournalEditor.
 */
export const SimpleForm = (props: SimpleFormProps) => {
    const editorProps = useSimpleJournalEditor(props);
    return <SimpleFormView {...editorProps} />;
};

export interface SimpleFormViewProps {
    type: TabType;
    setType: (type: TabType) => void;
    amount: string;
    setAmount: (amount: string) => void;
    sourceId: string;
    setSourceId: (id: string) => void;
    destinationId: string;
    setDestinationId: (id: string) => void;
    journalDate: string;
    setJournalDate: (date: string) => void;
    journalTime: string;
    setJournalTime: (time: string) => void;
    description: string;
    setDescription: (description: string) => void;
    isSubmitting: boolean;
    exchangeRate: number | null;
    isLoadingRate: boolean;
    rateError: string | null;
    isCrossCurrency: boolean;
    convertedAmount: number;
    transactionAccounts: Account[];
    expenseAccounts: Account[];
    incomeAccounts: Account[];
    sourceAccount?: Account;
    destAccount?: Account;
    sourceCurrency?: string;
    destCurrency?: string;
    handleSave: () => void;
}

export const SimpleFormView = ({
    type,
    setType,
    amount,
    setAmount,
    sourceId,
    setSourceId,
    destinationId,
    setDestinationId,
    journalDate,
    setJournalDate,
    journalTime,
    setJournalTime,
    description,
    setDescription,
    isSubmitting,
    exchangeRate,
    isLoadingRate,
    rateError,
    isCrossCurrency,
    convertedAmount,
    transactionAccounts,
    expenseAccounts,
    incomeAccounts,
    sourceAccount,
    destAccount,
    sourceCurrency,
    destCurrency,
    handleSave,
}: SimpleFormViewProps) => {
    const [showDatePicker, setShowDatePicker] = useState(false);

    const { theme } = useTheme();

    const activeColor = type === 'expense' ? theme.expense : type === 'income' ? theme.income : theme.primary;

    return (
        <View style={{ padding: Spacing.lg }}>
            <View style={{ alignItems: 'center', marginVertical: Spacing.lg, gap: Spacing.md }}>
                <AppText variant="caption" weight="bold" color="tertiary" style={{ letterSpacing: Typography.letterSpacing.wide * 2 }}>
                    {AppConfig.strings.transactionFlow.amount}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ marginVertical: Spacing.sm, marginTop: Spacing.md }}>
                        <AppText variant="title" weight="bold" style={{ color: theme.textSecondary, opacity: Opacity.heavy }}>
                            {sourceCurrency || 'USD'}
                        </AppText>
                    </View>
                    <AppInput
                        variant="hero"
                        style={{ color: activeColor }}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        autoFocus
                        cursorColor={activeColor}
                        selectionColor={withOpacity(activeColor, Opacity.muted)}
                        testID="amount-input"
                    />
                </View>
            </View>

            <View style={{ flexDirection: 'row', padding: Spacing.xs, backgroundColor: theme.surfaceSecondary, borderRadius: Shape.radius.r4, marginVertical: Spacing.xl }}>
                {(['expense', 'income', 'transfer'] as const).map(t => (
                    <TouchableOpacity
                        key={t}
                        testID={`tab-${t}`}
                        style={[
                            styles.typeTab,
                            type === t && { backgroundColor: theme.surface, ...Shape.elevation.sm }
                        ]}
                        onPress={() => setType(t)}
                    >
                        <AppText
                            variant="caption"
                            weight="bold"
                            style={{ color: type === t ? activeColor : theme.textSecondary }}
                        >
                            {t.toUpperCase()}
                        </AppText>
                    </TouchableOpacity>
                ))}
            </View>

            <AppCard elevation="none" variant="secondary" style={styles.mainCard}>
                {type === 'expense' && (
                    <>
                        <AccountTileList
                            title="To Category / Account"
                            accounts={expenseAccounts}
                            selectedId={destinationId}
                            onSelect={setDestinationId}
                            tintColor={activeColor}
                        />
                        <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />
                        <AccountTileList
                            title="From Account"
                            accounts={transactionAccounts}
                            selectedId={sourceId}
                            onSelect={setSourceId}
                            tintColor={activeColor}
                        />
                    </>
                )}

                {type === 'income' && (
                    <>
                        <AccountTileList
                            title="From Source / Account"
                            accounts={incomeAccounts}
                            selectedId={sourceId}
                            onSelect={setSourceId}
                            tintColor={activeColor}
                        />
                        <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />
                        <AccountTileList
                            title="To Account"
                            accounts={transactionAccounts}
                            selectedId={destinationId}
                            onSelect={setDestinationId}
                            tintColor={activeColor}
                        />
                    </>
                )}

                {type === 'transfer' && (
                    <>
                        <AccountTileList
                            title="Source Account"
                            accounts={transactionAccounts}
                            selectedId={sourceId}
                            onSelect={setSourceId}
                            tintColor={activeColor}
                        />
                        <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />
                        <AccountTileList
                            title="Destination Account"
                            accounts={transactionAccounts}
                            selectedId={destinationId}
                            onSelect={setDestinationId}
                            tintColor={activeColor}
                        />
                    </>
                )}
            </AppCard>

            {isCrossCurrency && sourceId && destinationId && (
                <View style={{ alignItems: 'center', padding: Spacing.md, borderRadius: Shape.radius.sm, backgroundColor: withOpacity(theme.primary, Opacity.soft), marginVertical: Spacing.lg }}>
                    {isLoadingRate ? (
                        <AppText variant="caption" color="secondary">{AppConfig.strings.transactionFlow.fetchingRate}</AppText>
                    ) : rateError ? (
                        <AppText variant="caption" color="error">{rateError}</AppText>
                    ) : exchangeRate ? (
                        <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
                            <AppText variant="caption" color="primary" weight="medium">
                                1 {sourceCurrency} = {exchangeRate.toFixed(4)} {destCurrency}
                            </AppText>
                            {parseFloat(amount) > 0 && (
                                <AppText variant="caption" color="primary">
                                    Total: {convertedAmount.toFixed(2)} {destCurrency}
                                </AppText>
                            )}
                        </View>
                    ) : null}
                </View>
            )}

            <View style={{ marginVertical: Spacing.lg }}>
                <AppText variant="caption" weight="bold" color="tertiary" style={{ marginLeft: Spacing.xs, marginBottom: Spacing.sm }}>
                    {AppConfig.strings.transactionFlow.schedule}
                </AppText>
                <TouchableOpacity
                    activeOpacity={Opacity.soft}
                    onPress={() => setShowDatePicker(true)}
                >
                    <AppCard elevation="none" padding="none" style={{ backgroundColor: theme.surfaceSecondary, borderColor: theme.border, borderWidth: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md }}>
                            <AppIcon name="calendar" size={Size.iconSm} color={theme.textSecondary} />
                            <AppText variant="body" style={{ flex: 1 }}>
                                {dayjs(`${journalDate}T${journalTime}`).format('DD MMM YYYY, HH:mm')}
                            </AppText>
                            <AppIcon name="chevronRight" size={Size.iconXs} color={theme.textSecondary} />
                        </View>
                    </AppCard>
                </TouchableOpacity>
            </View>

            <DateTimePickerModal
                visible={showDatePicker}
                date={journalDate}
                time={journalTime}
                onClose={() => setShowDatePicker(false)}
                onSelect={(d, t) => {
                    setJournalDate(d);
                    setJournalTime(t);
                }}
            />

            <View style={{ marginVertical: Spacing.lg }}>
                <AppText variant="caption" weight="bold" color="tertiary" style={{ marginLeft: Spacing.xs, marginBottom: Spacing.sm }}>
                    {AppConfig.strings.transactionFlow.descriptionOptional}
                </AppText>
                <AppInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder={
                        type === 'expense'
                            ? destAccount?.name || 'Expense'
                            : type === 'income'
                                ? sourceAccount?.name || 'Income'
                                : 'Transfer'
                    }
                    testID="description-input"
                    style={{ backgroundColor: theme.surfaceSecondary }}
                />
            </View>

            <View style={{ marginTop: Spacing.md }}>
                <AppButton
                    variant="primary"
                    onPress={handleSave}
                    disabled={!amount || !sourceId || !destinationId || (sourceId === destinationId) || isSubmitting || isLoadingRate || !!rateError}
                    testID="save-button"
                >
                    {isSubmitting ? AppConfig.strings.transactionFlow.saving : sourceId === destinationId ? AppConfig.strings.transactionFlow.chooseDifferentAccounts : AppConfig.strings.transactionFlow.save(type)}
                </AppButton>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    typeTab: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderRadius: Shape.radius.sm,
    },
    mainCard: {
        borderRadius: Shape.radius.r2,
        padding: Spacing.lg,
        marginVertical: Spacing.xl,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardDivider: { height: 1, marginVertical: Spacing.md, opacity: Opacity.muted },
    footerButton: {
        marginTop: Spacing.md,
    },
});
