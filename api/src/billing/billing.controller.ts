import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { BillingService } from './billing.service';
import { StripeProvider } from './stripe/stripe.provider';

/**
 * Billing module — IDF Mobilités.
 * Routes are exposed under the global `/api` prefix → `/api/billing/...`.
 *
 * `accountId` identifies the current account (no auth layer in this repo yet).
 * `subscriptionId` is optional: omit it for the global view ("all my passes"),
 * pass it to scope to a single pass.
 */
@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly stripe: StripeProvider,
  ) {}

  /** Pass selector — every pass the account can bill (holder / referrer / payer). */
  @Get('passes')
  @ApiQuery({ name: 'accountId', type: Number })
  @ApiOkResponse({ description: 'Passes visible to the account.' })
  getPasses(@Query('accountId', ParseIntPipe) accountId: number) {
    return this.billing.getPasses(accountId);
  }

  /** Onglet 1 — transaction history (all passes, or one if subscriptionId set). */
  @Get('transactions')
  @ApiQuery({ name: 'accountId', type: Number })
  @ApiQuery({ name: 'subscriptionId', type: Number, required: false })
  getTransactions(
    @Query('accountId', ParseIntPipe) accountId: number,
    @Query('subscriptionId') subscriptionId?: string,
  ) {
    const subId = subscriptionId ? Number(subscriptionId) : undefined;
    return this.billing.getTransactions(accountId, subId);
  }

  /** Onglet 2 — active SEPA mandate for a pass (Stripe seam — stubbed for now). */
  @Get('mandate')
  @ApiQuery({ name: 'accountId', type: Number })
  @ApiQuery({ name: 'subscriptionId', type: Number })
  async getMandate(
    @Query('accountId', ParseIntPipe) accountId: number,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    await this.billing.assertCanAccessPass(accountId, subscriptionId);
    return {
      connected: this.stripe.isConnected,
      mandate: await this.stripe.getMandate(subscriptionId),
    };
  }

  /** Onglet 3 — default payment method / masked RIB (Stripe seam — stubbed). */
  @Get('payment-method')
  @ApiQuery({ name: 'accountId', type: Number })
  @ApiQuery({ name: 'subscriptionId', type: Number })
  async getPaymentMethod(
    @Query('accountId', ParseIntPipe) accountId: number,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    await this.billing.assertCanAccessPass(accountId, subscriptionId);
    return {
      connected: this.stripe.isConnected,
      paymentMethod: await this.stripe.getDefaultPaymentMethod(subscriptionId),
    };
  }
}