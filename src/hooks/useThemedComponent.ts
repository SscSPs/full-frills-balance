import { getContextualTokens, ThemeMode, useThemeColors } from '@/src/constants'
import { useTheme } from '@/src/hooks/use-theme'

export function useThemedComponent(themeMode?: ThemeMode) {
  const { theme: globalTheme, tokens: globalTokens } = useTheme()
  const theme = useThemeColors(themeMode || 'light')
  const tokens = themeMode ? getContextualTokens(theme) : globalTokens
  return { theme: themeMode ? theme : globalTheme, tokens }
}
