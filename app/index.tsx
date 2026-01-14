import { router } from 'expo-router';
import { useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

export default function IndexScreen() {
  const { isOnboardingCompleted } = useUser();

  useEffect(() => {
    // Use setTimeout to ensure navigation happens after layout is mounted
    const timer = setTimeout(() => {
      if (isOnboardingCompleted) {
        router.replace('/accounts' as any);
      } else {
        router.replace('/onboarding' as any);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isOnboardingCompleted]);

  // Return a loading indicator while determining route
  return null;
}
