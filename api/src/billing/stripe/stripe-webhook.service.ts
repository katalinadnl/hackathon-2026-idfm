import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';

import { PrismaService } from '../../prisma/prisma.service';

type StripeClient = InstanceType<typeof Stripe>;

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private processedEvents = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  private getClient(): StripeClient {
    return new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }

  async handleEvent(rawBody: Buffer, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const stripe = this.getClient();
    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        secret,
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (this.processedEvents.has(event.id)) {
      this.logger.log(`Event ${event.id} already processed, skipping`);
      return;
    }
    this.processedEvents.add(event.id);
    if (this.processedEvents.size > 10000) {
      const entries = [...this.processedEvents];
      entries.splice(0, 5000);
      this.processedEvents = new Set(entries);
    }

    switch (event.type) {
      case 'setup_intent.succeeded':
        await this.handleSetupIntentSucceeded(event.data.object);
        break;
      case 'mandate.updated':
        await this.handleMandateUpdated(event.data.object);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleSetupIntentSucceeded(intent: any) {
    const customerId =
      typeof intent.customer === 'string'
        ? intent.customer
        : intent.customer?.id;
    if (!customerId) return;

    const account = await this.prisma.account.findUnique({
      where: { stripeCustomerId: customerId },
    });
    if (!account) {
      this.logger.warn(`No account for Stripe customer ${customerId}`);
      return;
    }

    const pmId =
      typeof intent.payment_method === 'string'
        ? intent.payment_method
        : (intent.payment_method?.id ?? null);
    const mandateId =
      typeof intent.mandate === 'string'
        ? intent.mandate
        : (intent.mandate?.id ?? null);

    if (!pmId) return;

    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        stripePreviousMandateId: account.stripeMandateId,
        stripePaymentMethodId: pmId,
        stripeMandateId: mandateId,
      },
    });

    this.logger.log(
      `Updated payment method for account ${account.id} via webhook`,
    );
  }

  private async handleMandateUpdated(mandate: any) {
    if (mandate.status === 'active') return;

    const accounts = await this.prisma.account.findMany({
      where: {
        OR: [
          { stripeMandateId: mandate.id },
          { stripePreviousMandateId: mandate.id },
        ],
      },
    });

    for (const account of accounts) {
      if (
        account.stripeMandateId === mandate.id &&
        mandate.status !== 'active'
      ) {
        await this.prisma.account.update({
          where: { id: account.id },
          data: {
            stripePreviousMandateId: account.stripeMandateId,
            stripeMandateId: null,
          },
        });
        this.logger.log(
          `Mandate ${mandate.id} revoked for account ${account.id}`,
        );
      }
    }
  }
}