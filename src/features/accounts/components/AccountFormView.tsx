import { AppButton, AppCard, AppInput, AppText, IconName, IvyIcon } from '@/src/components/core';
import { Screen } from '@/src/components/layout';
import { Shape, Spacing, Typography } from '@/src/constants';
import { AccountTypeSelector } from '@/src/features/accounts/components/AccountTypeSelector';
import { CurrencySelector } from '@/src/features/accounts/components/CurrencySelector';
import { AccountFormViewModel } from '@/src/features/accounts/hooks/useAccountFormViewModel';
import { AccountSelector } from '@/src/features/journal/components/AccountSelector';
import { IconPickerModal } from '@/src/features/onboarding/components/IconPickerModal';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export function AccountFormView(vm: AccountFormViewModel) {
    const {
        theme,
        title,
        heroTitle,
        heroSubtitle,
        isEditMode,
        accountName,
        setAccountName,
        accountType,
        setAccountType,
        selectedCurrency,
        setSelectedCurrency,
        selectedIcon,
        setSelectedIcon,
        isIconPickerVisible,
        setIsIconPickerVisible,
        initialBalance,
        onInitialBalanceChange,
        formError,
        onCancel,
        onSave,
        saveLabel,
        currencyLabel,
        showInitialBalance,
        isSaveDisabled,
        parentAccountId,
        parentAccountName,
        setParentAccountId,
        potentialParents,
        isParentPickerVisible,
        setIsParentPickerVisible,
    } = vm;

    return (
        <Screen
            title={title}
            onBack={onCancel}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <AppText variant="heading" style={styles.title}>
                        {heroTitle}
                    </AppText>
                    <AppText variant="body" color="secondary" style={styles.subtitle}>
                        {heroSubtitle}
                    </AppText>

                    {formError && (
                        <View style={[styles.errorContainer, { backgroundColor: theme.error + '20', borderColor: theme.error }]}
                        >
                            <AppText variant="body" style={{ color: theme.error }}>{formError}</AppText>
                        </View>
                    )}

                    <AppCard elevation="sm" padding="lg" style={styles.inputContainer}>
                        <View style={styles.nameRow}>
                            <TouchableOpacity
                                onPress={() => setIsIconPickerVisible(true)}
                                style={styles.iconButton}
                            >
                                <IvyIcon
                                    name={selectedIcon as IconName}
                                    color={theme.primary}
                                    size={40}
                                />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="Account Name"
                                    value={accountName}
                                    onChangeText={setAccountName}
                                    placeholder="e.g., Checking Account"
                                    autoFocus
                                    maxLength={100}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>
                    </AppCard>

                    {showInitialBalance && (
                        <AppCard elevation="sm" padding="lg" style={styles.inputContainer}>
                            <AppInput
                                label={isEditMode ? "Current Balance" : "Initial Balance"}
                                value={initialBalance}
                                onChangeText={onInitialBalanceChange}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                returnKeyType="next"
                                testID="initial-balance-input"
                            />
                        </AppCard>
                    )}

                    <AppCard elevation="sm" padding="lg" style={styles.inputContainer}>
                        <AppText variant="body" style={styles.label}>Account Type</AppText>
                        <AccountTypeSelector
                            value={accountType}
                            onChange={setAccountType}
                        />
                    </AppCard>

                    <AppCard elevation="sm" padding="lg" style={styles.inputContainer}>
                        <AppText variant="body" style={styles.label}>{currencyLabel}</AppText>
                        <CurrencySelector
                            selectedCurrency={selectedCurrency}
                            onSelect={setSelectedCurrency}
                            disabled={isEditMode}
                        />
                    </AppCard>

                    <AppCard elevation="sm" padding="lg" style={styles.inputContainer}>
                        <AppText variant="body" style={styles.label}>Parent Account (Optional)</AppText>
                        <TouchableOpacity
                            onPress={() => setIsParentPickerVisible(true)}
                            style={[styles.selectorButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                        >
                            <AppText variant="body" style={{ color: parentAccountId ? theme.text : theme.textSecondary }}>
                                {parentAccountName}
                            </AppText>
                            <View style={styles.selectorActions}>
                                {parentAccountId && (
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            setParentAccountId('');
                                        }}
                                        style={styles.clearButton}
                                    >
                                        <AppText variant="caption" color="secondary">Clear</AppText>
                                    </TouchableOpacity>
                                )}
                                <IvyIcon name="chevronDown" size={20} color={theme.textSecondary} />
                            </View>
                        </TouchableOpacity>
                    </AppCard>

                    <AppButton
                        variant="primary"
                        size="lg"
                        onPress={onSave}
                        disabled={isSaveDisabled}
                        style={styles.createButton}
                        testID="save-button"
                    >
                        {saveLabel}
                    </AppButton>
                    <View style={{ height: Spacing.xxxl }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <IconPickerModal
                visible={isIconPickerVisible}
                onClose={() => setIsIconPickerVisible(false)}
                onSelect={(icon) => {
                    setSelectedIcon(icon);
                    setIsIconPickerVisible(false);
                }}
                selectedIcon={selectedIcon as any}
            />
            <AccountSelector
                visible={isParentPickerVisible}
                accounts={potentialParents}
                selectedId={parentAccountId}
                onClose={() => setIsParentPickerVisible(false)}
                onSelect={(id) => {
                    setParentAccountId(id);
                    setIsParentPickerVisible(false);
                }}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    title: {
        fontSize: Typography.sizes.xxl,
        fontFamily: Typography.fonts.bold,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    label: {
        marginBottom: Spacing.sm,
        fontFamily: Typography.fonts.semibold,
    },
    createButton: {
        marginTop: Spacing.xl,
    },
    errorContainer: {
        padding: Spacing.md,
        borderRadius: Shape.radius.sm,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconButton: {
        marginTop: Spacing.md,
    },
    selectorButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Shape.radius.sm,
        borderWidth: 1,
        minHeight: 48,
    },
    selectorActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    clearButton: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Shape.radius.xs,
        backgroundColor: '#00000010',
    },
});
