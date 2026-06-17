import { Platform } from "react-native";
import { API_BASE_URL, http } from "@/services/api";
import { loadToken } from "@/services/storage";

export const CURRENT_ACCOUNT_ID = 2;

export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export type BillingRole = "holder" | "referrer" | "payer";

export type PaymentMode = "card_once" | "sepa_once" | "sepa_monthly";

export interface PassSummary {
  subscriptionId: number;
  navigoNumber: string;
  subscriptionType: string;
  status: string;
  holderName: string;
  roles: BillingRole[];
  startDate: string;
  endDate: string;
  paymentMode: PaymentMode;
  annualAmount: number;
  monthlyAmount: number | null;
  hasSepa: boolean;
}

export type TransactionStatus = "succeeded" | "failed" | "refunded";

export interface Transaction {
  id: string;
  date: string;
  label: string;
  amount: number;
  status: TransactionStatus;
  method: string;
  navigoNumber: string;
  paidByOther: string | null;
}

export type CurrentMonthStatus =
  | "paid"
  | "pending"
  | "upcoming"
  | "failed"
  | "not_applicable";

export interface MonthGroup {
  month: string;
  label: string;
  total: number;
  outstanding: number;
  transactions: Transaction[];
}

export interface TransactionsResponse {
  total: number;
  outstanding: number;
  currency: "EUR";
  transactions: Transaction[];
  monthGroups: MonthGroup[] | null;
  paymentMode: PaymentMode;
  currentMonthStatus: CurrentMonthStatus;
  nextPayment: { date: string; amount: number } | null;
  annualPaid: boolean;
}

export type MandateStatus = "active" | "pending" | "revoked";

export interface SepaMandate {
  reference: string;
  status: MandateStatus;
  scheme: "CORE";
  creditorName: string;
  creditorIcs: string;
  debtorName: string;
  ibanMasked: string;
  signedAt: string;
  revokedAt: string | null;
  navigoNumber: string;
  source: "local" | "stripe";
}

export interface MandateResponse {
  connected: boolean;
  active: SepaMandate | null;
  history: SepaMandate[];
}

export interface PaymentMethodInfo {
  type: "sepa_debit";
  ibanMasked: string;
  bankName: string;
  holderName: string;
  isDefault: boolean;
  source: "local" | "stripe";
}

export interface PaymentMethodResponse {
  connected: boolean;
  paymentMethod: PaymentMethodInfo | null;
}

export interface RibChangeResponse {
  connected: boolean;
  clientSecret: string | null;
  billingName: string | null;
  billingEmail: string | null;
  message: string;
}

export const billingApi = {
  getPasses(accountId: number) {
    return http.get<PassSummary[]>("/billing/passes");
  },
  getTransactions(accountId: number, subscriptionId?: number) {
    const qs =
      subscriptionId != null ? `?subscriptionId=${subscriptionId}` : "";
    return http.get<TransactionsResponse>(`/billing/transactions${qs}`);
  },
  getMandate(accountId: number, subscriptionId: number | null) {
    const qs =
      subscriptionId != null ? `?subscriptionId=${subscriptionId}` : "";
    return http.get<MandateResponse>(`/billing/mandate${qs}`);
  },
  getPaymentMethod(accountId: number, subscriptionId: number | null) {
    const qs =
      subscriptionId != null ? `?subscriptionId=${subscriptionId}` : "";
    return http.get<PaymentMethodResponse>(`/billing/payment-method${qs}`);
  },
  startRibChange(accountId: number, subscriptionId: number | null) {
    const qs =
      subscriptionId != null ? `?subscriptionId=${subscriptionId}` : "";
    return http.post<RibChangeResponse>(
      `/billing/payment-method/change${qs}`,
    );
  },
  retryPayment(paymentId: number) {
    return http.post<{ ok: boolean; message: string }>(
      `/billing/payment/retry?paymentId=${paymentId}`,
    );
  },
  payByCard(paymentId: number) {
    return http.post<{
      url: string | null;
      sessionId: string | null;
      message: string;
    }>(`/billing/payment/pay-by-card?paymentId=${paymentId}`);
  },
  finalizeRibChange(
    accountId: number,
    subscriptionId: number | null,
    setupIntentId: string,
  ) {
    const qs =
      subscriptionId != null
        ? `?subscriptionId=${subscriptionId}&setupIntentId=${setupIntentId}`
        : `?setupIntentId=${setupIntentId}`;
    return http.post<{ ok: boolean; connected: boolean }>(
      `/billing/payment-method/finalize${qs}`,
    );
  },
};

export async function mandateDocumentUrl(
  subscriptionId: number,
): Promise<string> {
  const token = await loadToken();

  const qs = new URLSearchParams({ subscriptionId: String(subscriptionId) });
  if (token) qs.append("token", token);
  const path = `/billing/mandate/document?${qs.toString()}`;
  if (Platform.OS === "web" && API_BASE_URL.startsWith("/")) {
    return `${window.location.origin}${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}${path}`;
}

export async function monthInvoiceUrl(month: string): Promise<string> {
  const token = await loadToken();
  const qs = new URLSearchParams({ month });
  if (token) qs.append("token", token);
  const path = `/billing/invoice/month?${qs.toString()}`;
  if (Platform.OS === "web" && API_BASE_URL.startsWith("/")) {
    return `${window.location.origin}${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}${path}`;
}

export async function invoiceUrl(paymentId: number): Promise<string> {
  const token = await loadToken();
  const qs = new URLSearchParams({ paymentId: String(paymentId) });
  if (token) qs.append("token", token);
  const path = `/billing/invoice?${qs.toString()}`;
  if (Platform.OS === "web" && API_BASE_URL.startsWith("/")) {
    return `${window.location.origin}${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}${path}`;
}