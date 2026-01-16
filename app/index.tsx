import 'react-native-get-random-values';

import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useUser } from '../contexts/UIContext';

export default function IndexScreen() {
  const { hasCompletedOnboarding, isInitialized } = useUser();

  // Show loading screen while preferences are being loaded
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/accounts" />;
  }

  return <Redirect href="/onboarding" />;
}
