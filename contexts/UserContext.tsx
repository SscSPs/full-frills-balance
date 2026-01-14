import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { preferences } from '../src/utils/preferences';

interface UserPreferences {
  userName: string;
  currencyCode: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

interface UserContextType {
  userPreferences: UserPreferences | null;
  setUserPreferences: (data: UserPreferences) => void;
  updateUserName: (name: string) => void;
  updateCurrencyCode: (code: string) => void;
  updateTheme: (theme: 'light' | 'dark' | 'system') => void;
  isOnboardingCompleted: boolean;
  completeOnboarding: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userPreferences, setUserPreferencesState] = useState<UserPreferences | null>(null);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);

  useEffect(() => {
    // Load preferences on mount
    const loadInitialData = async () => {
      const prefs = await preferences.loadPreferences();
      setIsOnboardingCompleted(prefs.onboardingCompleted);
      
      // Set default preferences if onboarding is completed
      if (prefs.onboardingCompleted) {
        setUserPreferencesState({
          userName: '', // This should come from user profile in DB
          currencyCode: prefs.defaultCurrencyCode || 'USD',
          theme: prefs.theme || 'system',
          language: 'en',
        });
      }
    };

    loadInitialData();
  }, []);

  const setUserPreferences = (data: UserPreferences) => {
    setUserPreferencesState(data);
  };

  const updateUserName = (name: string) => {
    if (userPreferences) {
      setUserPreferencesState({ ...userPreferences, userName: name });
    } else {
      setUserPreferencesState({ 
        userName: name, 
        currencyCode: 'USD',
        theme: 'system',
        language: 'en'
      });
    }
  };

  const updateCurrencyCode = async (code: string) => {
    if (userPreferences) {
      setUserPreferencesState({ ...userPreferences, currencyCode: code });
    } else {
      setUserPreferencesState({ 
        userName: '', 
        currencyCode: code,
        theme: 'system',
        language: 'en'
      });
    }
    // Persist default currency preference
    await preferences.setDefaultCurrencyCode(code);
  };

  const updateTheme = async (theme: 'light' | 'dark' | 'system') => {
    if (userPreferences) {
      setUserPreferencesState({ ...userPreferences, theme });
    } else {
      setUserPreferencesState({ 
        userName: '', 
        currencyCode: 'USD',
        theme,
        language: 'en'
      });
    }
    // Persist theme preference
    await preferences.setTheme(theme);
  };

  const completeOnboarding = async () => {
    await preferences.setOnboardingCompleted(true);
    setIsOnboardingCompleted(true);
  };

  return (
    <UserContext.Provider
      value={{
        userPreferences,
        setUserPreferences,
        updateUserName,
        updateCurrencyCode,
        updateTheme,
        isOnboardingCompleted,
        completeOnboarding,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
