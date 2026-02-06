import { AppButton, AppIcon, AppInput, AppText } from '@/src/components/core';
import { Opacity, Shape, Size, Spacing, withOpacity } from '@/src/constants';
import { useCurrencies } from '@/src/hooks/use-currencies';
import { useTheme } from '@/src/hooks/use-theme';
import { COMMON_CURRENCY_CODES } from '@/src/services/currency-init-service';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface StepCurrencyProps {
    selectedCurrency: string;
    onSelect: (code: string) => void;
    onContinue: () => void;
    onBack: () => void;
    isCompleting: boolean;
}

export const StepCurrency: React.FC<StepCurrencyProps> = ({
    selectedCurrency,
    onSelect,
    onContinue,
    onBack,
    isCompleting,
}) => {
    const { currencies } = useCurrencies();
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCurrencies = useMemo(() => {
        if (!searchQuery.trim()) {
            return currencies.filter(c => COMMON_CURRENCY_CODES.slice(0, 10).includes(c.code));
        }
        return currencies.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.code.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 50);
    }, [currencies, searchQuery]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.header}>
                <AppText variant="title" style={styles.title}>
                    Default Currency
                </AppText>
                <AppText variant="body" color="secondary" style={styles.subtitle}>
                    Select your primary currency. You can add more later.
                </AppText>
            </View>

            <View style={styles.searchContainer}>
                <AppInput
                    placeholder="Search currency..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerStyle={styles.searchBar}
                    accessibilityLabel="Search currencies"
                />
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.grid}>
                    {filteredCurrencies.map((currency) => {
                        const isSelected = selectedCurrency === currency.code;
                        return (
                            <TouchableOpacity
                                key={currency.code}
                                style={[
                                    styles.item,
                                    {
                                        backgroundColor: isSelected ? withOpacity(theme.primary, 0.05) : theme.surface,
                                        borderColor: isSelected ? theme.primary : theme.border,
                                    }
                                ]}
                                onPress={() => onSelect(currency.code)}
                                activeOpacity={Opacity.heavy}
                                accessibilityLabel={`${currency.name} (${currency.code}), ${isSelected ? 'selected' : 'not selected'}`}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isSelected }}
                            >
                                <View style={styles.itemHeader}>
                                    <View style={[styles.symbolContainer, { backgroundColor: isSelected ? withOpacity(theme.primary, Opacity.soft) : theme.background }]}>
                                        <AppText
                                            variant="heading"
                                            style={{ color: isSelected ? theme.primary : theme.text }}
                                        >
                                            {currency.symbol}
                                        </AppText>
                                    </View>
                                    {isSelected && (
                                        <AppIcon name="checkCircle" size={20} color={theme.primary} />
                                    )}
                                </View>

                                <View style={styles.itemContent}>
                                    <AppText
                                        variant="subheading"
                                        style={{ color: isSelected ? theme.primary : theme.text }}
                                    >
                                        {currency.code}
                                    </AppText>
                                    <AppText
                                        variant="caption"
                                        color="secondary"
                                        numberOfLines={1}
                                        style={{ color: isSelected ? withOpacity(theme.primary, 0.8) : theme.textSecondary }}
                                    >
                                        {currency.name}
                                    </AppText>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

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
    searchContainer: {
        marginBottom: Spacing.md,
    },
    searchBar: {
        marginBottom: 0,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
        paddingHorizontal: Spacing.xs, // Compensation for half-gap margin
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.xs, // Negative margin for nice alignment
    },
    item: {
        width: '46%', // approximate for 2 column
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
    symbolContainer: {
        width: Size.xl,
        height: Size.xl,
        borderRadius: Size.xl / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContent: {
        gap: Spacing.xs / 2,
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
