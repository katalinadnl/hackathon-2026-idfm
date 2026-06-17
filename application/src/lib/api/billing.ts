import { Platform } from "react-native";
import { http } from ".";
import { API_BASE_URL } from "@/services/api";
export const CURRENT_ACCOUNT_ID = 2;

export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export type BillingRole = "holder" | "referrer" | "payer";

export interface PassSummary {
  subscriptionId: number;
  navigoNumber: string;
  subscriptionType: string;
  status: string;
  holderName: string;
  roles: BillingRole[];
  startDate: string;
  endDate: string;
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
}

export interface TransactionsResponse {
  total: number;

  outstanding: number;
  currency: "EUR";
  transactions: Transaction[];
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

export interface RibChangeResponse {
  connected: boolean;
  clientSecret: string | null;
  billingName: string | null;
  billingEmail: string | null;
  message: string;
}
export interface PaymentMethodResponse {
  connected: boolean;
  paymentMethod: PaymentMethodInfo | null;
}
export const billingApi = {
  getPasses(accountId: number) {
    return http.get<PassSummary[]>("/billing/passes", { accountId });
  },
  getTransactions(accountId: number, subscriptionId?: number) {
    return http.get<TransactionsResponse>("/billing/transactions", {
      accountId,
      subscriptionId,
    });
  },
  getMandate(accountId: number, subscriptionId: number) {
    return http.get<MandateResponse>("/billing/mandate", {
      accountId,
      subscriptionId,
    });
  },
  getPaymentMethod(accountId: number, subscriptionId: number) {
    return http.get<PaymentMethodResponse>("/billing/payment-method", {
      accountId,
      subscriptionId,
    });
  },
  startRibChange(accountId: number, subscriptionId: number) {
    return http.post<RibChangeResponse>("/billing/payment-method/change", {
      accountId,
      subscriptionId,
    });
  },
  finalizeRibChange(
    accountId: number,
    subscriptionId: number,
    setupIntentId: string,
  ) {
    return http.post<{ ok: boolean; connected: boolean }>(
      "/billing/payment-method/finalize",
      { accountId, subscriptionId, setupIntentId },
    );
  },
};
export function mandateDocumentUrl(
  accountId: number,
  subscriptionId: number,
): string {
  const path = `/billing/mandate/document?accountId=${accountId}&subscriptionId=${subscriptionId}`;
  if (Platform.OS === "web" && API_BASE_URL.startsWith("/")) {
    return `${window.location.origin}${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}${path}`;
}
