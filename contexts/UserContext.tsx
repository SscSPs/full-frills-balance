import { AccountType } from '@/src/data/models/Account';
import { createContext, ReactNode, useContext, useState } from 'react';

interface UserData {
  userName: string;
  accounts: Array<{
    name: string;
    type: AccountType;
    currency: string;
  }>;
}

interface UserContextType {
  userData: UserData | null;
  setUserData: (data: UserData) => void;
  updateUserName: (name: string) => void;
  addAccount: (account: { name: string; type: AccountType; currency: string }) => void;
  removeAccount: (index: number) => void;
  isOnboardingCompleted: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userData, setUserDataState] = useState<UserData | null>(null);

  const setUserData = (data: UserData) => {
    setUserDataState(data);
  };

  const updateUserName = (name: string) => {
    if (userData) {
      setUserDataState({ ...userData, userName: name });
    } else {
      setUserDataState({ userName: name, accounts: [] });
    }
  };

  const addAccount = (account: { name: string; type: AccountType; currency: string }) => {
    if (userData) {
      setUserDataState({
        ...userData,
        accounts: [...userData.accounts, account]
      });
    } else {
      setUserDataState({ userName: '', accounts: [account] });
    }
  };

  const removeAccount = (index: number) => {
    if (userData) {
      setUserDataState({
        ...userData,
        accounts: userData.accounts.filter((_, i) => i !== index)
      });
    }
  };

  const isOnboardingCompleted = userData !== null && userData.userName.trim() !== '';

  return (
    <UserContext.Provider
      value={{
        userData,
        setUserData,
        updateUserName,
        addAccount,
        removeAccount,
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
