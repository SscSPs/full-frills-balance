/**
 * AppInput - Themed TextInput component
 * Consistent input design inspired by Ivy Wallet
 */

import { Shape, Spacing, ThemeMode } from '@/constants/design-tokens'
import { useThemeColors } from '@/constants/theme-helpers'
import { useTheme } from '@/hooks/use-theme'
import React from 'react'
import { StyleSheet, TextInput, type TextInputProps, View, ViewStyle } from 'react-native'
import { AppText } from './AppText'

export type AppInputProps = TextInputProps & {
    label?: string
    error?: string
    containerStyle?: ViewStyle
    themeMode?: ThemeMode
}

export function AppInput({
    label,
    error,
    containerStyle,
    themeMode,
    style,
    ...props
}: AppInputProps) {
    const { theme: globalTheme } = useTheme()
    const overrideTheme = useThemeColors(themeMode)
    const theme = themeMode ? overrideTheme : globalTheme

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <AppText
                    variant="body"
                    weight="medium"
                    style={styles.label}
                    themeMode={themeMode}
                >
                    {label}
                </AppText>
            )}
            <TextInput
                style={[
                    styles.input,
                    {
                        borderColor: error ? theme.error : theme.border,
                        color: theme.text,
                        backgroundColor: theme.surface,
                    },
                    style,
                ]}
                placeholderTextColor={theme.textSecondary}
                {...props}
            />
            {error && (
                <AppText
                    variant="caption"
                    color="error"
                    style={styles.error}
                    themeMode={themeMode}
                >
                    {error}
                </AppText>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        marginBottom: Spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: Shape.radius.r3,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: 16,
        minHeight: 48,
    },
    error: {
        marginTop: Spacing.xs,
    },
})
