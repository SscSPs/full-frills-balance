import { Redirect } from 'expo-router';
import { useUser } from '../contexts/UserContext';

export default function IndexScreen() {
  const { isOnboardingCompleted } = useUser();

  if (isOnboardingCompleted) {
    return <Redirect href="/accounts" />;
  }

  return <Redirect href="/onboarding" />;
}
