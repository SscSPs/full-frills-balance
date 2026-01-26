/**
 * NavigationBar - App-specific navigation header
 * Provides consistent title, back button and actions across screens
 */

import { AppText, IconButton } from '@/src/components/core'
import { Spacing } from '@/src/constants/design-tokens'
import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'

export type NavigationBarProps = {
    title: string
    subtitle?: string
    onBack?: () => void
    showBack?: boolean
    backIcon?: 'arrow-back' | 'close'
    rightActions?: React.ReactNode
    style?: ViewStyle
}

export function NavigationBar({
    title,
    subtitle,
    onBack,
    showBack = true,
    backIcon = 'arrow-back',
    rightActions,
    style
}: NavigationBarProps) {
    const router = useRouter()

    const handleBack = () => {
        if (onBack) {
            onBack()
        } else {
            router.back()
        }
    }

    return (
        <View style={[styles.container, style]}>
            <View style={styles.left}>
                {showBack && (
                    <IconButton
                        name={backIcon}
                        onPress={handleBack}
                        variant="surface"
                        style={styles.backButton}
                    />
                )}
            </View>

            <View style={styles.center}>
                <AppText variant="subheading" style={styles.title} numberOfLines={1}>
                    {title}
                </AppText>
                {subtitle && (
                    <AppText variant="caption" color="secondary" numberOfLines={1}>
                        {subtitle}
                    </AppText>
                )}
            </View>

            <View style={styles.right}>
                {rightActions}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        height: 64, // Standard header height
    },
    left: {
        width: 48,
        alignItems: 'flex-start',
    },
    center: {
        flex: 1,
        alignItems: 'center',
    },
    right: {
        width: 'auto',
        minWidth: 48,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.sm,
    },
    backButton: {
        // IconButton defaults are good
    },
    title: {
        textAlign: 'center',
    }
})
