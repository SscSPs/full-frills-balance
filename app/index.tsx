import 'react-native-get-random-values';

import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { TabNavigator } from '../components/layout';
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
    // Show custom tab navigator as home page
    return <TabNavigator />;
  }

  return <Redirect href="/onboarding" />;
}
