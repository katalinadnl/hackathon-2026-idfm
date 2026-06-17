import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { authApi, AuthUser } from '@/services/api';
import { clearToken, loadToken, saveToken } from '@/services/storage';

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  loginWithFranceConnect: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(async (newToken: string, newUser: AuthUser) => {
    await saveToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  // Bootstrap: restore a stored session on launch.
  useEffect(() => {
    (async () => {
      try {
        const stored = await loadToken();
        if (stored) {
          const me = await authApi.me(stored);
          setToken(stored);
          setUser(me);
        }
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      await persist(res.token, res.user);
    },
    [persist],
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      const res = await authApi.register(input);
      await persist(res.token, res.user);
    },
    [persist],
  );

  const finishWithToken = useCallback(
    async (newToken: string) => {
      const me = await authApi.me(newToken);
      await persist(newToken, me);
    },
    [persist],
  );

  const loginWithFranceConnect = useCallback(async () => {
    const returnUrl = Linking.createURL('auth');
    const startUrl = `${authApi.franceConnectUrl()}?redirect=${encodeURIComponent(
      returnUrl,
    )}`;

    const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
    if (result.type !== 'success' || !result.url) {
      if (result.type === 'cancel' || result.type === 'dismiss') return;
      throw new Error('Connexion France Connect annulée.');
    }

    const { queryParams } = Linking.parse(result.url);
    const error = queryParams?.error as string | undefined;
    if (error) throw new Error(`France Connect : ${error}`);

    const fcToken = queryParams?.token as string | undefined;
    if (!fcToken) throw new Error('Aucun jeton reçu de France Connect.');

    await finishWithToken(fcToken);
  }, [finishWithToken]);

  const logout = useCallback(async () => {
    try {
      if (token) await authApi.logout(token);
    } catch {
      /* ignore network errors on logout */
    }
    await clearToken();
    setToken(null);
    setUser(null);
  }, [token]);

  // Handle deep links that arrive while the app is already foregrounded (native).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Linking.addEventListener('url', ({ url }) => {
      const { path, queryParams } = Linking.parse(url);
      if (path === 'auth' && queryParams?.token) {
        finishWithToken(queryParams.token as string).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [finishWithToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithFranceConnect,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
