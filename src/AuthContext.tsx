import React, {
  createContext, useState, useContext, useEffect, useCallback, type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY, USER_KEY, setUnauthorizedHandler } from './api/client';
import type { AppUser, Member } from './api/types';

interface AuthContextValue {
  token: string | null;
  user: AppUser | null;
  member: Member | null;
  loading: boolean;
  signIn: (token: string, user: AppUser, member: Member | null) => Promise<void>;
  signOut: () => Promise<void>;
  setMember: (member: Member | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [member, setMemberState] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (t) setToken(t);
        if (u) setUser(JSON.parse(u) as AppUser);
      } catch {
        // logged-out fallthrough
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      setMemberState(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(async (newToken: string, newUser: AppUser, newMember: Member | null) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setMemberState(newMember);
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
    setMemberState(null);
  }, []);

  const setMember = useCallback((m: Member | null) => setMemberState(m), []);

  return (
    <AuthContext.Provider value={{ token, user, member, loading, signIn, signOut, setMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
