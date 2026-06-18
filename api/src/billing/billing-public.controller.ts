import { Controller, Get, ParseIntPipe, Query, Res } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller('billing')
export class BillingPublicController {
  constructor(private readonly billing: BillingService) {}

  @Get('payment/card-return')
  @ApiQuery({ name: 'paymentId', type: Number })
  @ApiQuery({ name: 'sessionId', type: String })
  @ApiQuery({ name: 'redirectTo', type: String, required: false })
  async cardReturn(
    @Query('paymentId', ParseIntPipe) paymentId: number,
    @Query('sessionId') sessionId: string,
    @Query('redirectTo') redirectTo: string | undefined,
    @Res() res: Response,
  ) {
    await this.billing.confirmCardPayment(paymentId, sessionId);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost';
    res.redirect(`${frontendUrl}${redirectTo || '/billing'}`);
  }
}