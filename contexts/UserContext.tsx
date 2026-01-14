import { createContext, ReactNode, useContext, useState } from 'react';

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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userPreferences, setUserPreferencesState] = useState<UserPreferences | null>(null);

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

  const updateCurrencyCode = (code: string) => {
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
  };

  const updateTheme = (theme: 'light' | 'dark' | 'system') => {
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
  };

  const isOnboardingCompleted = userPreferences !== null && userPreferences.userName.trim() !== '';

  return (
    <UserContext.Provider
      value={{
        userPreferences,
        setUserPreferences,
        updateUserName,
        updateCurrencyCode,
        updateTheme,
        isOnboardingCompleted,
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
