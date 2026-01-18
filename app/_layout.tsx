import 'react-native-get-random-values';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';
import { UIProvider } from '../contexts/UIContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <UIProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="accounts" options={{ headerShown: false }} />
          <Stack.Screen name="journal-entry" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="account-creation" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="_design-preview" options={{ headerShown: false }} />
        </Stack>
        
        <StatusBar style="auto" />
      </ThemeProvider>
    </UIProvider>
  );
}
