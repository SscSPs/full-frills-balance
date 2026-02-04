import { AppButton, AppCard, AppIcon, AppText } from '@/src/components/core';
import { Opacity, Size, Spacing, withOpacity } from '@/src/constants';
import { useCurrencies } from '@/src/hooks/use-currencies';
import { useTheme } from '@/src/hooks/use-theme';
import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

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

    return (
        <View style={styles.container}>
            <AppText variant="title" style={styles.title}>
                Default Currency
            </AppText>
            <AppText variant="body" color="secondary" style={styles.subtitle}>
                Choose the default currency for your accounts and transactions.
            </AppText>

            <AppCard elevation="sm" padding="none" style={styles.currencyListContainer}>
                <FlatList
                    data={currencies}
                    keyExtractor={(item) => item.code}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.currencyItem,
                                { borderBottomColor: theme.border },
                                selectedCurrency === item.code && { backgroundColor: withOpacity(theme.primary, Opacity.soft / 2) }
                            ]}
                            onPress={() => onSelect(item.code)}
                        >
                            <View style={styles.currencyInfo}>
                                <AppText variant="body">{item.name}</AppText>
                                <AppText variant="caption" color="secondary">{item.code}</AppText>
                            </View>
                            <View style={styles.currencyRight}>
                                <AppText variant="subheading">{item.symbol}</AppText>
                                {selectedCurrency === item.code && (
                                    <AppIcon name="checkCircle" size={Size.sm} color={theme.primary} style={{ marginLeft: Spacing.sm }} />
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </AppCard>

            <View style={styles.buttonContainer}>
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
                    variant="outline"
                    size="lg"
                    onPress={onBack}
                    disabled={isCompleting}
                >
                    Back
                </AppButton>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    title: {
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    currencyListContainer: {
        height: Size.xxl * 6,
        marginBottom: Spacing.xl,
        overflow: 'hidden',
    },
    currencyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    currencyInfo: {
        flex: 1,
    },
    currencyRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonContainer: {
        gap: Spacing.md,
    },
    continueButton: {
        marginBottom: Spacing.xs,
    },
});
