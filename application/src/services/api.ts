import Constants from "expo-constants";
import { Platform } from "react-native";
import { clearToken, loadToken } from "./storage";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

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

// ── Base URL ──────────────────────────────────────────────────────────────────

/**
 * Resolve the API base URL.
 * - Override with EXPO_PUBLIC_API_URL (recommended in production / docker).
 * - Web: same origin behind the nginx proxy (`/api`), as an absolute URL.
 * - Native dev: the Metro host on port 3000 (`http://<host>:3000/api`).
 */
function resolveBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/$/, "");

  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/api`;
    }
    return "/api";
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)
      ?.debuggerHost ??
    "";
  const host = hostUri.split(":")[0] || "localhost";
  return `http://${host}:3000/api`;
}

export const API_BASE_URL = resolveBaseUrl();

// Branché par l'AuthProvider pour rediriger vers /login sur 401,
// sans que ce fichier ait besoin de connaître expo-router.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

// ── Core request ──────────────────────────────────────────────────────────────

type RequestOptions = {
  method?: string;
  body?: unknown;
  /** Token explicite (utile pour /auth/me, /auth/logout pendant le flow d'auth) */
  token?: string | null;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.token ?? (await loadToken());

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return null as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (res.status === 401 && !path.includes("/auth/")) {
    await clearToken();
    onUnauthorized?.();
    throw new ApiError(401, "Session expirée");
  }

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || `Erreur ${res.status}`;
    throw new ApiError(
      res.status,
      Array.isArray(message) ? message.join(", ") : message,
      data?.errors,
    );
  }

  return data as T;
}

// ── Public HTTP helpers ──────────────────────────────────────────────────────

export const http = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),

  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body }),
};
