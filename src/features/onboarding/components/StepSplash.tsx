import { AppButton, AppInput, AppText } from '@/src/components/core';
import { Spacing, Typography } from '@/src/constants';
import { useImport } from '@/src/hooks/use-import';
import { useTheme } from '@/src/hooks/use-theme';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface StepSplashProps {
    name: string;
    setName: (name: string) => void;
    onContinue: () => void;
    isCompleting: boolean;
}

export const StepSplash: React.FC<StepSplashProps> = ({
    name,
    setName,
    onContinue,
    isCompleting,
}) => {
    const { theme } = useTheme();
    const { isImporting } = useImport();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <AppText variant="hero" style={styles.title}>
                    Welcome{'\n'}to Balance
                </AppText>
                <AppText variant="body" color="secondary" style={styles.subtitle}>
                    Let&apos;s personalize your experience.
                </AppText>
            </View>

            <View style={styles.content}>
                <AppInput
                    label="What should we call you?"
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                    accessibilityLabel="Your name"
                    containerStyle={styles.inputContainer}
                />

                <AppButton
                    variant="primary"
                    size="lg"
                    onPress={onContinue}
                    disabled={!name.trim() || isCompleting}
                    style={styles.continueButton}
                    accessibilityLabel="Continue to next step"
                    accessibilityState={{ disabled: !name.trim() || isCompleting }}
                >
                    Get Started
                </AppButton>
            </View>

            <View style={styles.footer}>
                <View style={styles.divider}>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                    <AppText variant="caption" color="secondary" style={styles.orText}>OR</AppText>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                </View>

                <AppButton
                    variant="ghost"
                    size="md"
                    onPress={() => router.push('/import-selection')}
                    loading={isImporting}
                    disabled={isImporting || isCompleting}
                    accessibilityLabel="Import backup from file"
                >
                    Restore Backup
                </AppButton>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: Spacing.xl,
    },
    header: {
        alignItems: 'center',
        paddingTop: Spacing.xl,
    },
    title: {
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    subtitle: {
        textAlign: 'center',
    },
    content: {
        width: '100%',
        paddingHorizontal: Spacing.md,
    },
    inputContainer: {
        marginBottom: Spacing.xl,
    },
    continueButton: {
        width: '100%',
    },
    footer: {
        width: '100%',
        paddingBottom: Spacing.lg,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        paddingHorizontal: Spacing.xl,
    },
    line: {
        flex: 1,
        height: 1,
    },
    orText: {
        marginHorizontal: Spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: Typography.sizes.xs,
    },
});
