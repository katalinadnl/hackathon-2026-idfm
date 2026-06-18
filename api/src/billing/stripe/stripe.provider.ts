import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';

import { PrismaService } from '../../prisma/prisma.service';
import {
  MandateStatus,
  PaymentMethodInfo,
  SepaMandate,
} from '../dto/billing.types';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';

type StripeClient = InstanceType<typeof Stripe>;

const CREDITOR_NAME = 'Île-de-France Mobilités';
const CREDITOR_ICS = 'FR93ZZZ123456';

@Injectable()
export class StripeProvider {
  private client: StripeClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionsService,
  ) {}

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
      include: { bankInfo: { include: { account: true } }, beneficiary: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return { payer: sub.bankInfo.account, beneficiary: sub.beneficiary };
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
    const { payer } = await this.payerOf(subscriptionId);
    if (!payer?.stripeMandateId) return null;
    return this.buildMandate(payer.stripeMandateId, subscriptionId);
  }

  async getMandateHistory(subscriptionId: number): Promise<SepaMandate[]> {
    const { payer } = await this.payerOf(subscriptionId);
    if (!payer?.stripePreviousMandateId) return [];
    try {
      return [
        await this.buildMandate(
          payer.stripePreviousMandateId,
          subscriptionId,
          'revoked',
        ),
      ];
    } catch {
      return [];
    }
  }

  private async buildMandate(
    mandateId: string,
    subscriptionId: number,
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
    const subscription = await this.subscriptionService.findOne(subscriptionId);
    const navigo = this.subscriptionService.getActivePass(subscription.passes);

    if (!navigo) {
      throw new BadRequestException('Aucun pass actif pour cet abonnement.');
    }
    return {
      reference:
        mandate.payment_method_details?.sepa_debit?.reference ?? mandateId,
      status: statusOverride ?? this.mapMandateStatus(mandate.status),
      scheme: 'CORE',
      creditorName: CREDITOR_NAME,
      creditorIcs: CREDITOR_ICS,
      debtorName: pm?.billing_details?.name ?? '—',
      ibanMasked: this.maskIban(sepa?.last4 ?? null),
      navigoNumber: navigo?.navigoNumber,
      signedAt: pm
        ? new Date(pm.created * 1000).toISOString()
        : new Date().toISOString(),
      revokedAt: null,
      subscriptionId,
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
    const { payer, beneficiary } = await this.payerOf(subscriptionId);
    if (!payer?.stripeCustomerId) return null;

    const stripe = this.getClient();
    let customerId = payer.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: payer.email,
        name: payer.email,
        metadata: { accountId: String(payer.id) },
      });
      customerId = customer.id;
      await this.prisma.account.update({
        where: { id: payer.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const intent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['sepa_debit'],
      usage: 'off_session',
    });
    if (!intent.client_secret) return null;

    const billingName = beneficiary
      ? `${beneficiary.firstName} ${beneficiary.lastName}`
      : payer.email.split('@')[0];
    return {
      clientSecret: intent.client_secret,
      billingName,
      billingEmail: payer.email,
    };
  }

  async retryPayment(
    subscriptionId: number,
    amount: number,
  ): Promise<{ ok: boolean; error?: string }> {
    const { payer } = await this.payerOf(subscriptionId);
    if (!payer?.stripeCustomerId || !payer?.stripePaymentMethodId) {
      return { ok: false, error: 'Aucun moyen de paiement configuré.' };
    }

    try {
      const stripe = this.getClient();
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'eur',
        customer: payer.stripeCustomerId,
        payment_method: payer.stripePaymentMethodId,
        payment_method_types: ['sepa_debit'],
        confirm: true,
        off_session: true,
      });
      return {
        ok: intent.status === 'succeeded' || intent.status === 'processing',
      };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  async createCardCheckoutSession(
    payerId: number,
    amount: number,
    description: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string; sessionId: string } | null> {
    const payer = await this.prisma.account.findUnique({
      where: { id: payerId },
    });
    if (!payer) return null;

    const stripe = this.getClient();
    let customerId = payer.stripeCustomerId;

    if (!customerId) {
      const name = payer.email.split('@')[0];
      const customer = await stripe.customers.create({
        email: payer.email,
        name,
        metadata: { accountId: String(payer.id) },
      });
      customerId = customer.id;
      await this.prisma.account.update({
        where: { id: payer.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(amount * 100),
            product_data: { name: description },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return session.url ? { url: session.url, sessionId: session.id } : null;
  }

  async checkCheckoutSession(sessionId: string): Promise<{ paid: boolean }> {
    try {
      const session =
        await this.getClient().checkout.sessions.retrieve(sessionId);
      return { paid: session.payment_status === 'paid' };
    } catch {
      return { paid: false };
    }
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
