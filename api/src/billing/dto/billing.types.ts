// Shared response shapes for the Billing module.
// Kept framework-agnostic so the same types can be reused by a Stripe-backed
// implementation later (see stripe/stripe.provider.ts).

export type BillingRole = 'holder' | 'referrer' | 'payer';

export interface PassSummary {
  subscriptionId: number;
  navigoNumber: string;
  subscriptionType: string;
  status: string; // active | expired | ...
  /** Full name of the pass holder (beneficiary). */
  holderName: string;
  /** Roles the current account has on this pass. */
  roles: BillingRole[];
  startDate: string; // ISO
  endDate: string; // ISO
}

export type TransactionStatus = 'succeeded' | 'failed' | 'refunded';

export interface Transaction {
  id: string;
  /** ISO date of the debit/refund. */
  date: string;
  /** Human-readable label, e.g. "Navigo Mois Étudiant — Alice Martin". */
  label: string;
  /** Signed amount in euros: negative for a debit, positive for a refund. */
  amount: number;
  status: TransactionStatus;
  /** card | direct_debit | sepa_debit ... */
  method: string;
  navigoNumber: string;
}

export interface TransactionsResponse {
  /** Net total of the listed transactions, in euros. */
  total: number;
  currency: 'EUR';
  transactions: Transaction[];
}