/**
 * Badge - Small, informative badge component
 * Clean, minimal badge design inspired by Ivy Wallet
 */

import { Shape, Spacing, ThemeMode, Typography } from '@/constants/design-tokens'
import { getContrastColor, useThemeColors } from '@/constants/theme-helpers'
import { useTheme } from '@/hooks/use-theme'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, View, type ViewProps } from 'react-native'
import { AppText } from './AppText'

export type BadgeProps = ViewProps & {
  // Badge content
  children: React.ReactNode
  // Badge variants - limited options
  variant?: 'default' | 'success' | 'warning' | 'error' | 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  // Badge size
  size?: 'sm' | 'md'
  // Use solid background instead of light tinted background
  solid?: boolean
  // Theme mode override (for design preview)
  themeMode?: ThemeMode
  // Optional Icon
  icon?: keyof typeof Ionicons.glyphMap
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  solid = false,
  icon,
  themeMode,
  style,
  ...props
}: BadgeProps) {
  const { theme: globalTheme } = useTheme()
  const overrideTheme = useThemeColors(themeMode)
  const theme = themeMode ? overrideTheme : globalTheme

  // Get badge styles based on variant
  const getBadgeStyles = () => {
    const baseStyles = {
      borderRadius: Shape.radius.full,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      alignSelf: 'flex-start' as const,
    }

    switch (variant) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: theme.successLight,
        }
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: theme.warningLight,
        }
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: theme.errorLight,
        }
      case 'asset':
        return {
          ...baseStyles,
          backgroundColor: theme.primaryLight,
        }
      case 'liability':
        return {
          ...baseStyles,
          backgroundColor: theme.warningLight,
        }
      case 'equity':
        return {
          ...baseStyles,
          backgroundColor: theme.successLight,
        }
      case 'income':
        return {
          ...baseStyles,
          backgroundColor: theme.successLight,
        }
      case 'expense':
        return {
          ...baseStyles,
          backgroundColor: theme.errorLight,
        }
      default:
        return {
          ...baseStyles,
          backgroundColor: theme.surfaceSecondary,
        }
    }
  }

  // Get padding styles based on size
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs,
          minWidth: 20,
          minHeight: 20,
        }
      case 'md':
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.xs,
          minWidth: 24,
          minHeight: 24,
        }
      default:
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.xs,
          minWidth: 24,
          minHeight: 24,
        }
    }
  }

  // Get background and text colors based on variant and solid state
  const getColors = () => {
    let backgroundColor: string = theme.surfaceSecondary
    let textColor: string = theme.textSecondary

    const variants: Record<string, { main: string; light: string }> = {
      success: { main: theme.success, light: theme.successLight },
      warning: { main: theme.warning, light: theme.warningLight },
      error: { main: theme.error, light: theme.errorLight },
      asset: { main: theme.asset, light: theme.primaryLight },
      liability: { main: theme.liability, light: theme.warningLight },
      equity: { main: theme.equity, light: theme.successLight },
      income: { main: theme.income, light: theme.successLight },
      expense: { main: theme.expense, light: theme.errorLight },
    }

    if (variants[variant]) {
      const colors = variants[variant]
      backgroundColor = solid ? colors.main : colors.light
      textColor = solid ? getContrastColor(colors.main) : colors.main
    } else {
      // Default variant
      backgroundColor = theme.surfaceSecondary
      textColor = theme.textSecondary
    }

    return { backgroundColor, textColor }
  }

  const { backgroundColor, textColor } = getColors()

  // Get text styles based on size
  const getTextStyles = () => {
    switch (size) {
      case 'sm':
        return {
          fontSize: Typography.sizes.xs,
          fontFamily: Typography.fonts.semibold,
        }
      case 'md':
        return {
          fontSize: Typography.sizes.sm,
          fontFamily: Typography.fonts.semibold,
        }
      default:
        return {
          fontSize: Typography.sizes.sm,
          fontFamily: Typography.fonts.semibold,
        }
    }
  }

  return (
    <View
      style={[
        styles.badge,
        getBadgeStyles(),
        getSizeStyles(),
        { backgroundColor },
        style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {icon && (
          <Ionicons
            name={icon}
            size={size === 'sm' ? 12 : 14}
            color={textColor}
            style={styles.icon}
          />
        )}
        <AppText
          variant="caption"
          style={[
            getTextStyles(),
            { color: textColor }
          ]}
        >
          {children}
        </AppText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    // Base badge styles
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 4,
  },
})
