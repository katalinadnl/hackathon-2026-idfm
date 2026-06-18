export type BillingRole = 'holder' | 'referrer' | 'payer';

export type PassStatus = 'active' | 'blocked' | 'replaced';
export type PaymentModeLabel = 'CARD_ONCE' | 'SEPA_ONCE' | 'SEPA_MONTHLY';

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
  paymentMode: PaymentModeLabel;
  annualAmount: number;
  monthlyAmount: number | null;
  hasSepa: boolean;
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
  navigoNumber: string;
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
  bankName: string | null;
  holderName: string;
  isDefault: boolean;
  source: 'local' | 'stripe';
}

export interface PaymentMethodResponse {
  connected: boolean;
  paymentMethod: PaymentMethodInfo | null;
}

export type TransactionStatus = 'succeeded' | 'failed' | 'refunded';

export interface Transaction {
  id: string;
  date: string;
  label: string;
  amount: number;
  status: TransactionStatus;
  method: PaymentModeLabel;
  subscriptionId: number;
  navigoNumber: string;
  paidByOther: string | null;
}

export type CurrentMonthStatus =
  | 'paid'
  | 'pending'
  | 'upcoming'
  | 'failed'
  | 'not_applicable';

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
  currency: 'EUR';
  transactions: Transaction[];
  monthGroups: MonthGroup[] | null;
  paymentMode: PaymentModeLabel;
  currentMonthStatus: CurrentMonthStatus;
  nextPayment: { date: string; amount: number } | null;
  annualPaid: boolean;
}
