import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "web" ? "/api" : "http://localhost:3000/api");

const TOKEN_KEY = "accessToken";

// SecureStore n'existe pas sur web ; localStorage n'existe pas sur natif.
// On unifie l'accès au token derrière ces helpers.
async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

// Callback branché par l'AuthProvider pour rediriger vers /login
// sans que ce fichier ait besoin de connaître expo-router.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return `${BASE_URL}${path}`;

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  }
  return `${BASE_URL}${path}?${qs.toString()}`;
}

const api = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = await getToken();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null as T;

  if (response.status === 401 && !endpoint.includes("/auth/")) {
    await clearToken();
    onUnauthorized?.();
    throw new ApiError(401, "Session expirée");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.message ?? "Erreur serveur",
      data.errors,
    );
  }

  return data as T;
};

export const http = {
  get: <T>(endpoint: string, params?: Record<string, unknown>) =>
    api<T>(buildUrl(endpoint, params).replace(BASE_URL, "")),

  post: <T>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) => api<T>(endpoint, { method: "DELETE" }),
};
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}
