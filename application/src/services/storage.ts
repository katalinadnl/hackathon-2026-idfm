import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Token storage abstraction: SecureStore on native, localStorage on web.
const KEY = 'auth_token';

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(KEY, token);
    } catch {
      /* SSR / unavailable */
    }
    return;
  }
  await SecureStore.setItemAsync(KEY, token);
}

export async function loadToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(KEY);
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
