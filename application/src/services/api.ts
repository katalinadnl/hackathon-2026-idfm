import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type AuthUser = {
  id: number;
  email: string;
  accountNumber: string;
  firstName: string | null;
  lastName: string | null;
};

export type AuthResponse = { token: string; user: AuthUser };

/**
 * Resolve the API base URL.
 * - Override with EXPO_PUBLIC_API_URL (recommended in production / docker).
 * - Web: same origin behind the nginx proxy (`/api`).
 * - Native dev: the Metro host on port 3000 (`http://<host>:3000/api`).
 */
function resolveBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/$/, '');

  if (Platform.OS === 'web') {
    // Same origin behind the nginx proxy, but as an absolute URL so it can be
    // passed to the browser (openAuthSessionAsync / WebBrowser needs absolute).
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/api`;
    }
    return '/api';
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as any)?.debuggerHost ??
    '';
  const host = hostUri.split(':')[0] || 'localhost';
  return `http://${host}:3000/api`;
}

export const API_BASE_URL = resolveBaseUrl();

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || `Erreur ${res.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  return data as T;
}

export const authApi = {
  register: (body: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => request<AuthResponse>('/auth/register', { method: 'POST', body }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body }),

  logout: (token: string) =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST', token }),

  me: (token: string) => request<AuthUser>('/auth/me', { token }),

  /** Full URL the browser should open to start the France Connect flow. */
  franceConnectUrl: () => `${API_BASE_URL}/auth/france-connect/login`,
};
