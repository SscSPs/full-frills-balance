import { AppCard, AppText } from '@/components/core';
import { Spacing } from '@/constants/design-tokens';
import { useThemeColors } from '@/constants/theme-helpers';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme()
  const themeMode = colorScheme === 'dark' ? 'dark' : 'light'
  const theme = useThemeColors(themeMode)

  
  return (
    <View style={styles.container}>
      <View style={[styles.header, { 
        backgroundColor: theme.primaryLight
      }]}>
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      </View>
      
      <AppCard elevation="none" padding="lg" style={styles.titleContainer} themeMode={themeMode}>
        <AppText variant="title" themeMode={themeMode}>Welcome!</AppText>
        <AppText variant="body" color="primary" themeMode={themeMode}>👋</AppText>
      </AppCard>
      
      <AppCard elevation="sm" padding="lg" style={styles.stepContainer} themeMode={themeMode}>
        <AppText variant="heading" themeMode={themeMode}>Step 1: Try it</AppText>
        <AppText variant="body" themeMode={themeMode}>
          Edit <AppText variant="body" weight="semibold" themeMode={themeMode}>app/(tabs)/index.tsx</AppText> to see changes.
          Press{' '}
          <AppText variant="body" weight="semibold" themeMode={themeMode}>
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </AppText>{' '}
          to open developer tools.
        </AppText>
      </AppCard>
      
      <AppCard elevation="sm" padding="lg" style={styles.stepContainer} themeMode={themeMode}>
        <Link href="/modal">
          <AppText variant="heading" color="primary" themeMode={themeMode}>Step 2: Explore</AppText>
        </Link>
        <AppText variant="body" themeMode={themeMode}>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </AppText>
      </AppCard>
      
      <AppCard elevation="sm" padding="lg" style={styles.stepContainer} themeMode={themeMode}>
        <AppText variant="heading" themeMode={themeMode}>Step 3: Get a fresh start</AppText>
        <AppText variant="body" themeMode={themeMode}>
          {`When you're ready, run `}
          <AppText variant="body" weight="semibold" themeMode={themeMode}>npm run reset-project</AppText> to get a fresh{' '}
          <AppText variant="body" weight="semibold" themeMode={themeMode}>app</AppText> directory. This will move the current{' '}
          <AppText variant="body" weight="semibold" themeMode={themeMode}>app</AppText> to{' '}
          <AppText variant="body" weight="semibold" themeMode={themeMode}>app-example</AppText>.
        </AppText>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  stepContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
