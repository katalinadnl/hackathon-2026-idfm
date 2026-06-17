import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { BillingController } from './billing.controller';
import { BillingPublicController } from './billing-public.controller';
import { BillingService } from './billing.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { MandatePdfService } from './mandate-pdf.service';
import { StripeProvider } from './stripe/stripe.provider';
import { StripeWebhookController } from './stripe/stripe-webhook.controller';
import { StripeWebhookService } from './stripe/stripe-webhook.service';
import { AdminBillingController } from './admin/admin-billing.controller';
import { AdminBillingService } from './admin/admin-billing.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    BillingController,
    BillingPublicController,
    StripeWebhookController,
    AdminBillingController,
  ],
  providers: [
    BillingService,
    InvoicePdfService,
    MandatePdfService,
    StripeProvider,
    StripeWebhookService,
    AdminBillingService,
  ],
  exports: [BillingService],
})
export class BillingModule {}
