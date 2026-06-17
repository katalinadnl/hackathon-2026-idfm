export type BillingRole = 'holder' | 'referrer' | 'payer';

export type PassStatus = 'active' | 'blocked' | 'replaced';

export interface PassSummary {
  subscriptionId: number;
  navigoNumber: string | null;
  passStatus: PassStatus | null;
  subscriptionType: string;
  status: string;
  holderName: string;
  roles: BillingRole[];
  startDate: string;
  endDate: string;
}

export type MandateStatus = 'active' | 'pending' | 'revoked';

export interface SepaMandate {
  reference: string;
  status: MandateStatus;
  scheme: 'CORE';
  creditorName: string;
  creditorIcs: string;
  debtorName: string;
  ibanMasked: string;
  signedAt: string;
  revokedAt: string | null;
  subscriptionId: number;
  source: 'local' | 'stripe';
}

export interface MandateResponse {
  connected: boolean;
  active: SepaMandate | null;
  history: SepaMandate[];
}

export interface PaymentMethodInfo {
  type: 'sepa_debit';
  ibanMasked: string;
  bankName: string;
  holderName: string;
  isDefault: boolean;
  source: 'local' | 'stripe';
}

export interface PaymentMethodResponse {
  connected: boolean;
  paymentMethod: PaymentMethodInfo | null;
}

export type TransactionStatus = 'succeeded' | 'failed' | 'refunded';
export type TransactionMethod = 'card' | 'direct_debit';

export interface Transaction {
  id: string;
  date: string;
  label: string;
  amount: number;
  status: TransactionStatus;
  method: TransactionMethod;
  subscriptionId: number;
  navigoNumber: string | null;
}

export interface TransactionsResponse {
  total: number;
  outstanding: number;
  currency: 'EUR';
  transactions: Transaction[];
}
