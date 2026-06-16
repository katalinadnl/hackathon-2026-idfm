import { Platform } from 'react-native';

// Minimal typed HTTP client for the NestJS billing API.
//
// Base URL resolution:
//  - EXPO_PUBLIC_API_URL wins (e.g. your LAN IP when testing on a device).
//  - On web, default to the same-origin "/api" — nginx proxies it to api:3000.
//  - On native, default to the local Nest dev server.
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'web' ? '/api' : 'http://localhost:3000/api');

// No auth layer in the repo yet → the current account is passed explicitly.
// Demo personas (see prisma/seeds.ts):
//   1 = Alice (holder + payer, own pass)
//   2 = Bernard (2 passes: active w/ a failed debit + expired w/ 12 months) ← richest demo
//   3 = Pierre Moreau (référent-payeur of Théo, no pass of his own)
//   4 = Clara
export const CURRENT_ACCOUNT_ID = 2;

export type BillingRole = 'holder' | 'referrer' | 'payer';

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

export type TransactionStatus = 'succeeded' | 'failed' | 'refunded';

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
  currency: 'EUR';
  transactions: Transaction[];
}

async function get<T>(path: string, params: Record<string, unknown>): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  }
  const res = await fetch(`${BASE_URL}${path}?${qs.toString()}`);
  if (!res.ok) {
    throw new Error(`API ${path} → ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const billingApi = {
  getPasses(accountId: number) {
    return get<PassSummary[]>('/billing/passes', { accountId });
  },
  getTransactions(accountId: number, subscriptionId?: number) {
    return get<TransactionsResponse>('/billing/transactions', {
      accountId,
      subscriptionId,
    });
  },
};