import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getState, useStore, type User } from './store';

const AUTH_KEY = 'padel-nomads-auth-user';

type AuthContextValue = {
  user: User | null;
  login: (identifier: string) => User | null;
  loginAs: (userId: string) => User | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem(AUTH_KEY));

  // Keep the live user object in sync with the store.
  const user = useStore((s) => (userId ? s.users.find((u) => u.id === userId) ?? null : null));

  useEffect(() => {
    if (userId) localStorage.setItem(AUTH_KEY, userId);
    else localStorage.removeItem(AUTH_KEY);
  }, [userId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login(identifier: string) {
        const id = identifier.trim().toLowerCase();
        const match = getState().users.find(
          (u) =>
            u.email?.toLowerCase() === id ||
            u.phoneNumber.replace(/\s/g, '') === identifier.replace(/\s/g, ''),
        );
        if (match) setUserId(match.id);
        return match ?? null;
      },
      loginAs(id: string) {
        const match = getState().users.find((u) => u.id === id);
        if (match) setUserId(match.id);
        return match ?? null;
      },
      logout() {
        setUserId(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
