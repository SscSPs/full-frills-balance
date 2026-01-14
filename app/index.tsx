import { router } from 'expo-router';
import { useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

export default function IndexScreen() {
  const { isOnboardingCompleted } = useUser();

  useEffect(() => {
    if (isOnboardingCompleted) {
      router.replace('/accounts');
    } else {
      router.replace('/onboarding');
    }
  }, [isOnboardingCompleted]);

  return null;
}
