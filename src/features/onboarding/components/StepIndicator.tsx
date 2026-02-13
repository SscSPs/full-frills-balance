import { AppIcon } from '@/src/components/core/AppIcon';
import { Shape, Size, Spacing } from '@/src/constants';
import { useTheme } from '@/src/hooks/use-theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
    currentStep,
    totalSteps,
}) => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <View style={styles.dotsContainer}>
                {Array.from({ length: totalSteps }, (_, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;

                    return (
                        <View key={stepNumber} style={styles.stepWrapper}>
                            <View
                                style={[
                                    styles.dot,
                                    {
                                        width: isActive ? Size.lg : Spacing.md,
                                        backgroundColor: isActive
                                            ? theme.primary
                                            : isCompleted
                                                ? theme.success
                                                : theme.border,
                                        borderColor: isActive
                                            ? theme.primary
                                            : isCompleted
                                                ? theme.success
                                                : theme.border,
                                    },
                                ]}
                            >
                                {isCompleted && (
                                    <AppIcon name="check" size={Spacing.sm} color={theme.surface} strokeWidth={Spacing.xs} />
                                )}
                            </View>
                            {index < totalSteps - 1 && (
                                <View
                                    style={[
                                        styles.connector,
                                        {
                                            backgroundColor: isCompleted
                                                ? theme.success
                                                : theme.border,
                                        },
                                    ]}
                                />
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        height: Spacing.md,
        borderRadius: Shape.radius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    connector: {
        width: Size.xs,
        height: 2,
        marginHorizontal: Spacing.xs,
        borderRadius: Shape.radius.r1,
    },
});
