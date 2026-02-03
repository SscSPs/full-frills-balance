import { useUI } from '@/src/contexts/UIContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

/**
 * Root Index - Entry point for the application.
 * Routes user to the appropriate screen based on onboarding status.
 */
export function RootIndexScreen() {
  const { isInitialized, hasCompletedOnboarding } = useUI();

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return hasCompletedOnboarding ? <Redirect href="/(tabs)" /> : <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
