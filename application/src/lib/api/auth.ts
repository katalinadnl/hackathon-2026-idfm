import { API_BASE_URL, http } from "@/services/api";

export type AuthUser = {
  id: number;
  email: string;
  accountNumber: string;
  firstName: string | null;
  lastName: string | null;
};

export type AuthResponse = { token: string; user: AuthUser };

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => http.post<AuthResponse>("/auth/register", body),

  login: (body: { email: string; password: string }) =>
    http.post<AuthResponse>("/auth/login", body),

  logout: (token: string) =>
    http.post<{ success: boolean }>("/auth/logout", token),

  me: (token: string) => http.get<AuthUser>("/auth/me"),

  /** Full URL the browser should open to start the France Connect flow. */
  franceConnectUrl: () => `${API_BASE_URL}/auth/france-connect/login`,
};
