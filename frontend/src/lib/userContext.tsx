'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from './types';

interface UserContextValue {
  user: User | null;
  initialized: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY = 'inventory_user';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUserState(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setInitialized(true);
  }, []);

  const setUser = (u: User) => {
    setUserState(u);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const clearUser = () => {
    setUserState(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <UserContext.Provider value={{ user, initialized, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
