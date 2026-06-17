import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

import { PrismaService } from '../../prisma/prisma.service';
import {
  MandateStatus,
  PaymentMethodInfo,
  SepaMandate,
} from '../dto/billing.types';

type StripeClient = InstanceType<typeof Stripe>;

const CREDITOR_NAME = 'Île-de-France Mobilités';
const CREDITOR_ICS = 'FR93ZZZ123456';

@Injectable()
export class StripeProvider {
  private client: StripeClient | null = null;

  constructor(private readonly prisma: PrismaService) {}

  get isConnected(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }

  private getClient(): StripeClient {
    if (!this.client) {
      this.client = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    }
    return this.client;
  }

  private async payerOf(subscriptionId: number) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { payer: { include: { beneficiary: true } } },
    });
    return sub
      ? { payer: sub.payer, navigoNumber: sub.navigoNumber }
      : { payer: null, navigoNumber: '' };
  }

  private maskIban(last4: string | null): string {
    return `FR76 •••• •••• •••• •••• ${last4 ?? '••••'}`;
  }

  private mapMandateStatus(status: string): MandateStatus {
    if (status === 'active') return 'active';
    if (status === 'pending') return 'pending';
    return 'revoked';
  }

  async getMandate(subscriptionId: number): Promise<SepaMandate | null> {
    const { payer, navigoNumber } = await this.payerOf(subscriptionId);
    if (!payer?.stripeMandateId) return null;
    return this.buildMandate(payer.stripeMandateId, navigoNumber);
  }

  async getMandateHistory(subscriptionId: number): Promise<SepaMandate[]> {
    const { payer, navigoNumber } = await this.payerOf(subscriptionId);
    if (!payer?.stripePreviousMandateId) return [];
    try {
      return [
        await this.buildMandate(
          payer.stripePreviousMandateId,
          navigoNumber,
          'revoked',
        ),
      ];
    } catch {
      return [];
    }
  }

  private async buildMandate(
    mandateId: string,
    navigoNumber: string,
    statusOverride?: MandateStatus,
  ): Promise<SepaMandate> {
    const stripe = this.getClient();
    const mandate = await stripe.mandates.retrieve(mandateId);
    const pmId =
      typeof mandate.payment_method === 'string'
        ? mandate.payment_method
        : mandate.payment_method?.id;
    const pm = pmId ? await stripe.paymentMethods.retrieve(pmId) : null;
    const sepa = pm?.sepa_debit;

    return {
      reference:
        mandate.payment_method_details?.sepa_debit?.reference ?? mandateId,
      status: statusOverride ?? this.mapMandateStatus(mandate.status),
      scheme: 'CORE',
      creditorName: CREDITOR_NAME,
      creditorIcs: CREDITOR_ICS,
      debtorName: pm?.billing_details?.name ?? '—',
      ibanMasked: this.maskIban(sepa?.last4 ?? null),
      signedAt: pm
        ? new Date(pm.created * 1000).toISOString()
        : new Date().toISOString(),
      revokedAt: null,
      navigoNumber,
      source: 'stripe',
    };
  }

  async getDefaultPaymentMethod(
    subscriptionId: number,
  ): Promise<PaymentMethodInfo | null> {
    const { payer } = await this.payerOf(subscriptionId);
    if (!payer?.stripePaymentMethodId) return null;

    const pm = await this.getClient().paymentMethods.retrieve(
      payer.stripePaymentMethodId,
    );
    const sepa = pm.sepa_debit;

    return {
      type: 'sepa_debit',
      ibanMasked: this.maskIban(sepa?.last4 ?? null),
      bankName: sepa?.bank_code ? `Banque ${sepa.bank_code}` : 'Compte SEPA',
      holderName: pm.billing_details?.name ?? '—',
      isDefault: true,
      source: 'stripe',
    };
  }

  async createSepaSetupIntent(subscriptionId: number): Promise<{
    clientSecret: string;
    billingName: string;
    billingEmail: string;
  } | null> {
    const { payer } = await this.payerOf(subscriptionId);
    if (!payer?.stripeCustomerId) return null;

    const intent = await this.getClient().setupIntents.create({
      customer: payer.stripeCustomerId,
      payment_method_types: ['sepa_debit'],
      usage: 'off_session',
    });
    if (!intent.client_secret) return null;

    const billingName = payer.beneficiary
      ? `${payer.beneficiary.firstName} ${payer.beneficiary.lastName}`
      : payer.email.split('@')[0];
    return {
      clientSecret: intent.client_secret,
      billingName,
      billingEmail: payer.email,
    };
  }

  async finalizeRibChange(
    subscriptionId: number,
    setupIntentId: string,
  ): Promise<{ ok: boolean }> {
    const { payer } = await this.payerOf(subscriptionId);
    if (!payer?.stripeCustomerId) return { ok: false };

    try {
      const stripe = this.getClient();
      const intent = await stripe.setupIntents.retrieve(setupIntentId);
      const pmId =
        typeof intent.payment_method === 'string'
          ? intent.payment_method
          : (intent.payment_method?.id ?? null);
      const mandateId =
        typeof intent.mandate === 'string'
          ? intent.mandate
          : (intent.mandate?.id ?? null);
      if (!pmId) return { ok: false };

      await stripe.customers.update(payer.stripeCustomerId, {
        invoice_settings: { default_payment_method: pmId },
      });
      await this.prisma.account.update({
        where: { id: payer.id },
        data: {
          stripePreviousMandateId: payer.stripeMandateId,
          stripePaymentMethodId: pmId,
          stripeMandateId: mandateId,
        },
      });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }
}
