/**
 * Theme Hook
 * 
 * Consolidates theme logic used across all screens.
 */

import { ThemeMode, useThemeColors } from '@/constants'
import { useUser } from '@/contexts/UIContext'
import { useColorScheme } from '@/hooks/use-color-scheme'

export function useTheme() {
    const { themePreference } = useUser()
    const systemColorScheme = useColorScheme()

    const themeMode: ThemeMode = themePreference === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themePreference as ThemeMode

    const theme = useThemeColors(themeMode)

    return { theme, themeMode }
}
