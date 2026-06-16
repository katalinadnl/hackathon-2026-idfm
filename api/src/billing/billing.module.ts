import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeProvider } from './stripe/stripe.provider';

@Module({
  imports: [PrismaModule],
  controllers: [BillingController],
  providers: [BillingService, StripeProvider],
})
export class BillingModule {}