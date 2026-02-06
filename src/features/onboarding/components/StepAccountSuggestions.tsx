import { AppButton, AppIcon, AppInput, AppText } from '@/src/components/core';
import { IconName } from '@/src/components/core/AppIcon';
import { Opacity, Shape, Size, Spacing, withOpacity } from '@/src/constants';
import { useTheme } from '@/src/hooks/use-theme';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { DEFAULT_ACCOUNTS } from '../constants';
import { IconPickerModal } from './IconPickerModal';

interface StepAccountSuggestionsProps {
    selectedAccounts: string[];
    customAccounts: { name: string; icon: IconName }[];
    onToggleAccount: (name: string) => void;
    onAddCustomAccount: (name: string, icon: IconName) => void;
    onContinue: () => void;
    onBack: () => void;
    isCompleting: boolean;
}

export const StepAccountSuggestions: React.FC<StepAccountSuggestionsProps> = ({
    selectedAccounts,
    customAccounts,
    onToggleAccount,
    onAddCustomAccount,
    onContinue,
    onBack,
    isCompleting,
}) => {
    const { theme } = useTheme();
    const [customName, setCustomName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<IconName>('wallet');
    const [isIconPickerVisible, setIsIconPickerVisible] = useState(false);

    const handleAddCustom = () => {
        if (!customName.trim()) return;
        onAddCustomAccount(customName.trim(), selectedIcon);
        setCustomName('');
        setSelectedIcon('wallet');
    };

    const allSuggestions = [
        ...DEFAULT_ACCOUNTS,
        ...customAccounts.map(acc => ({ name: acc.name, icon: acc.icon, isCustom: true }))
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.header}>
                <AppText variant="title" style={styles.title}>
                    Setup Accounts
                </AppText>
                <AppText variant="body" color="secondary" style={styles.subtitle}>
                    Where is your money? Select all that apply.
                </AppText>
            </View>

            <View style={styles.customInputContainer}>
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => setIsIconPickerVisible(true)}
                    accessibilityLabel="Select icon for custom account"
                    accessibilityRole="button"
                >
                    <AppIcon name={selectedIcon} size={Size.sm} color={theme.primary} />
                </TouchableOpacity>

                <AppInput
                    placeholder="Add custom account..."
                    value={customName}
                    onChangeText={setCustomName}
                    containerStyle={styles.customInput}
                    accessibilityLabel="Custom account name input"
                />

                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: customName.trim() ? theme.primary : theme.border }]}
                    onPress={handleAddCustom}
                    disabled={!customName.trim()}
                    accessibilityLabel="Add custom account"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !customName.trim() }}
                >
                    <AppIcon name="add" size={Size.sm} color={theme.surface} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.grid}>
                    {allSuggestions.map((account) => {
                        const isSelected = selectedAccounts.includes(account.name);
                        return (
                            <TouchableOpacity
                                key={account.name}
                                style={[
                                    styles.item,
                                    {
                                        backgroundColor: isSelected ? withOpacity(theme.primary, 0.05) : theme.surface,
                                        borderColor: isSelected ? theme.primary : theme.border,
                                    }
                                ]}
                                onPress={() => onToggleAccount(account.name)}
                                activeOpacity={Opacity.heavy}
                                accessibilityLabel={`${account.name} account, ${isSelected ? 'selected' : 'not selected'}`}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isSelected }}
                            >
                                <View style={styles.itemHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: isSelected ? withOpacity(theme.primary, Opacity.soft) : theme.background }]}>
                                        <AppIcon
                                            name={account.icon}
                                            size={20}
                                            color={isSelected ? theme.primary : theme.text}
                                        />
                                    </View>
                                    {isSelected && (
                                        <AppIcon name="checkCircle" size={20} color={theme.primary} />
                                    )}
                                </View>

                                <View style={styles.itemContent}>
                                    <AppText
                                        variant="subheading"
                                        style={{ color: isSelected ? theme.primary : theme.text }}
                                        numberOfLines={1}
                                    >
                                        {account.name}
                                    </AppText>
                                    <AppText
                                        variant="caption"
                                        color="secondary"
                                        style={{ color: isSelected ? withOpacity(theme.primary, 0.8) : theme.textSecondary }}
                                    >
                                        Account
                                    </AppText>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <IconPickerModal
                visible={isIconPickerVisible}
                onClose={() => setIsIconPickerVisible(false)}
                onSelect={(icon) => setSelectedIcon(icon)}
                selectedIcon={selectedIcon}
            />

            <View style={styles.footer}>
                <AppButton
                    variant="primary"
                    size="lg"
                    onPress={onContinue}
                    disabled={isCompleting}
                    style={styles.continueButton}
                >
                    Continue
                </AppButton>
                <AppButton
                    variant="ghost"
                    size="md"
                    onPress={onBack}
                    disabled={isCompleting}
                >
                    Back
                </AppButton>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    title: {
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    subtitle: {
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
        paddingHorizontal: Spacing.xs,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.xs,
    },
    item: {
        width: Size.gridItemWidth,
        margin: Size.gridItemMargin,
        borderRadius: Shape.radius.r3,
        borderWidth: 1.5,
        padding: Spacing.md,
        minHeight: Size.cardMinHeight,
        justifyContent: 'space-between',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    iconContainer: {
        width: Size.xl,
        height: Size.xl,
        borderRadius: Size.xl / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContent: {
        gap: Spacing.xs / 2,
    },
    customInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    customInput: {
        flex: 1,
        marginBottom: 0,
    },
    iconButton: {
        width: Size.inputMd,
        height: Size.inputMd,
        borderRadius: Shape.radius.r2,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        width: Size.inputMd,
        height: Size.inputMd,
        borderRadius: Size.inputMd / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    continueButton: {
        width: '100%',
    },
});
