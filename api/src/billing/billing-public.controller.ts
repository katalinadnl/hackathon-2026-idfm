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
  async cardReturn(
    @Query('paymentId', ParseIntPipe) paymentId: number,
    @Query('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    await this.billing.confirmCardPayment(paymentId, sessionId);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:8081';
    res.redirect(`${frontendUrl}/billing`);
  }
}