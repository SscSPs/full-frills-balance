import { AppButton, AppIcon, AppInput, AppText } from '@/src/components/core';
import { IconName } from '@/src/components/core/AppIcon';
import { Opacity, Shape, Size, Spacing, withOpacity } from '@/src/constants';
import { useTheme } from '@/src/hooks/use-theme';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { DEFAULT_CATEGORIES } from '../constants';
import { IconPickerModal } from './IconPickerModal';

interface StepCategorySuggestionsProps {
    selectedCategories: string[];
    customCategories: { name: string; type: 'INCOME' | 'EXPENSE'; icon: IconName }[];
    onToggleCategory: (name: string) => void;
    onAddCustomCategory: (name: string, type: 'INCOME' | 'EXPENSE', icon: IconName) => void;
    onContinue: () => void;
    onBack: () => void;
    isCompleting: boolean;
}

export const StepCategorySuggestions: React.FC<StepCategorySuggestionsProps> = ({
    selectedCategories,
    customCategories,
    onToggleCategory,
    onAddCustomCategory,
    onContinue,
    onBack,
    isCompleting,
}) => {
    const { theme } = useTheme();
    const [customName, setCustomName] = useState('');
    const [customType, setCustomType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [selectedIcon, setSelectedIcon] = useState<IconName>('tag');
    const [isIconPickerVisible, setIsIconPickerVisible] = useState(false);

    const handleAddCustom = () => {
        if (!customName.trim()) return;
        onAddCustomCategory(customName.trim(), customType, selectedIcon);
        setCustomName('');
        setSelectedIcon(customType === 'EXPENSE' ? 'tag' : 'trendingUp');
    };

    const handleTypeChange = (type: 'INCOME' | 'EXPENSE') => {
        setCustomType(type);
        setSelectedIcon(type === 'EXPENSE' ? 'tag' : 'trendingUp');
    };

    const allSuggestions = [
        ...DEFAULT_CATEGORIES,
        ...customCategories.map(cat => ({
            name: cat.name,
            icon: cat.icon,
            type: cat.type,
            isCustom: true
        }))
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.header}>
                <AppText variant="title" style={styles.title}>
                    Setup Categories
                </AppText>
                <AppText variant="body" color="secondary" style={styles.subtitle}>
                    Select categories you use often.
                </AppText>
            </View>

            <View style={styles.customInputContainer}>
                <View style={styles.inputRow}>
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => setIsIconPickerVisible(true)}
                        accessibilityLabel="Select icon for custom category"
                        accessibilityRole="button"
                    >
                        <AppIcon name={selectedIcon} size={Size.sm} color={theme.primary} />
                    </TouchableOpacity>

                    <AppInput
                        placeholder="Add category..."
                        value={customName}
                        onChangeText={setCustomName}
                        containerStyle={styles.customInput}
                        accessibilityLabel="Custom category name input"
                    />

                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: customName.trim() ? theme.primary : theme.border }]}
                        onPress={handleAddCustom}
                        disabled={!customName.trim()}
                        accessibilityLabel="Add custom category"
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !customName.trim() }}
                    >
                        <AppIcon name="add" size={Size.sm} color={theme.surface} />
                    </TouchableOpacity>
                </View>
                <View style={styles.typeToggle}>
                    <TouchableOpacity
                        onPress={() => handleTypeChange('EXPENSE')}
                        style={[
                            styles.typeButton,
                            customType === 'EXPENSE' && { backgroundColor: withOpacity(theme.error, Opacity.soft), borderColor: theme.error }
                        ]}
                    >
                        <AppText variant="caption" style={{ color: customType === 'EXPENSE' ? theme.error : theme.textSecondary }}>Expense</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleTypeChange('INCOME')}
                        style={[
                            styles.typeButton,
                            customType === 'INCOME' && { backgroundColor: withOpacity(theme.success, Opacity.soft), borderColor: theme.success }
                        ]}
                    >
                        <AppText variant="caption" style={{ color: customType === 'INCOME' ? theme.success : theme.textSecondary }}>Income</AppText>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.grid}>
                    {allSuggestions.map((category) => {
                        const isSelected = selectedCategories.includes(category.name);
                        const behaviorColor = category.type === 'INCOME' ? theme.success : theme.error;

                        return (
                            <TouchableOpacity
                                key={category.name}
                                style={[
                                    styles.item,
                                    {
                                        backgroundColor: isSelected ? withOpacity(behaviorColor, 0.05) : theme.surface,
                                        borderColor: isSelected ? behaviorColor : theme.border,
                                    }
                                ]}
                                onPress={() => onToggleCategory(category.name)}
                                activeOpacity={Opacity.heavy}
                            >
                                <View style={styles.itemHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: isSelected ? withOpacity(behaviorColor, Opacity.soft) : theme.background }]}>
                                        <AppIcon
                                            name={category.icon}
                                            size={20}
                                            color={isSelected ? behaviorColor : theme.textSecondary}
                                        />
                                    </View>
                                    {isSelected && (
                                        <AppIcon name="checkCircle" size={20} color={behaviorColor} />
                                    )}
                                </View>

                                <View style={styles.itemContent}>
                                    <AppText
                                        variant="subheading"
                                        style={{ color: isSelected ? theme.text : theme.text }}
                                        numberOfLines={1}
                                    >
                                        {category.name}
                                    </AppText>
                                    <AppText
                                        variant="caption"
                                        color="secondary"
                                        style={{ color: isSelected ? behaviorColor : theme.textSecondary }}
                                    >
                                        {category.type === 'INCOME' ? 'Income' : 'Expense'}
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
        width: '46%',
        margin: '2%',
        borderRadius: Shape.radius.r3,
        borderWidth: 1.5,
        padding: Spacing.md,
        minHeight: 110, // Minimum touchable height
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
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
    typeToggle: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingLeft: Size.inputMd + Spacing.sm, // Align with input
    },
    typeButton: {
        paddingVertical: 4,
        paddingHorizontal: Spacing.md,
        borderRadius: Shape.radius.r3,
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
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
