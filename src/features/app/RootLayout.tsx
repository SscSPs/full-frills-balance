import { ErrorBoundary } from '@/src/components/core';
import { UIProvider, useUI } from '@/src/contexts/UIContext';
import { database } from '@/src/data/database/Database';
import { RestartRequiredScreen } from '@/src/features/dev';
import { useAppBootstrap } from '@/src/features/app/hooks/useAppBootstrap';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import {
  Raleway_600SemiBold,
  Raleway_700Bold,
  Raleway_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/raleway';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    'Raleway-SemiBold': Raleway_600SemiBold,
    'Raleway-Bold': Raleway_700Bold,
    'Raleway-ExtraBold': Raleway_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <DatabaseProvider database={database}>
          <UIProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AppContent />
            </ThemeProvider>
          </UIProvider>
        </DatabaseProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { isRestartRequired } = useUI();

  useAppBootstrap();

  if (isRestartRequired) {
    return <RestartRequiredScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="journal-entry" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="account-creation" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="_design-preview" options={{ headerShown: false }} />
      <Stack.Screen name="account-details" options={{ headerShown: false }} />
      <Stack.Screen name="transaction-details" options={{ headerShown: false }} />
      <Stack.Screen name="account-reorder" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="import-selection" options={{ headerShown: false }} />
      <Stack.Screen name="audit-log" options={{ headerShown: false }} />
    </Stack>
  );
}
