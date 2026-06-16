import { Injectable } from '@nestjs/common';

/**
 * Stripe seam.
 * --------------------------------------------------------------------------
 * This is the single place that knows how billing data is sourced. Today it
 * returns data derived from our own Postgres (no Stripe account wired yet).
 *
 * When we connect the real Stripe account, we ONLY change this file:
 *   1. `npm i stripe` in /api
 *   2. add STRIPE_SECRET_KEY to api/.env
 *   3. replace the stub bodies below with real SDK calls
 *      (stripe.charges.list, stripe.paymentMethods.retrieve, mandates, ...)
 * The controller, service and frontend stay untouched.
 */

export interface StripeMandate {
  id: string;
  status: 'active' | 'pending' | 'inactive';
  reference: string; // RUM — Référence Unique de Mandat
  scheme: 'sepa_debit';
  signedAt: string | null; // ISO
  creditorName: string;
  ibanLast4: string | null;
}

export interface StripePaymentMethod {
  id: string;
  type: string; // sepa_debit | card | ...
  ibanLast4: string | null;
  bankName: string | null;
  isDefault: boolean;
}

@Injectable()
export class StripeProvider {
  /** True once a real Stripe key is configured. Drives "coming soon" UX. */
  get isConnected(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }

  // ── Onglet 2 — Mandat SEPA ───────────────────────────────────────────────
  // TODO(stripe): retrieve the PaymentMethod (sepa_debit) of the customer tied
  // to this subscription and return its mandate.
  async getMandate(_subscriptionId: number): Promise<StripeMandate | null> {
    return null;
  }

  // ── Onglet 3 — RIB / moyen de paiement par défaut ────────────────────────
  // TODO(stripe): retrieve the customer's default PaymentMethod (sepa_debit)
  // and expose the masked IBAN.
  async getDefaultPaymentMethod(
    _subscriptionId: number,
  ): Promise<StripePaymentMethod | null> {
    return null;
  }
}