import { API_BASE_URL, http } from "@/services/api";

export type AuthUser = {
  id: number;
  email: string;
  accountNumber: string;
  firstName: string | null;
  lastName: string | null;
};

export type AuthResponse = { token: string; user: AuthUser };
export type LoginResponse =
  | AuthResponse
  | { requires2FA: true; message: string };

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => http.post<AuthResponse>("/auth/register", body),

  login: (body: { email: string; password: string }) =>
    http.post<LoginResponse>("/auth/login", body),

  verifyOtp: (body: { email: string; code: string }) =>
    http.post<AuthResponse>("/auth/2fa/verify", body),

  forgotPassword: (body: { email: string }) =>
    http.post<{ message: string }>("/auth/forgot-password", body),

  resetPassword: (body: { token: string; newPassword: string }) =>
    http.post<{ message: string }>("/auth/reset-password", body),

  logout: (token: string) =>
    http.post<{ success: boolean }>("/auth/logout", token),

  me: (token: string) => http.get<AuthUser>("/auth/me"),

  /** Full URL the browser should open to start the France Connect flow. */
  franceConnectUrl: () => `${API_BASE_URL}/auth/france-connect/login`,
};
