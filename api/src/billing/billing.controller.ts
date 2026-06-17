import {
  Controller,
  Get,
  Header,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';

function accountIdOf(req: Request): number {
  return (req as any).user.sub as number;
}

@ApiTags('Billing')
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('passes')
  @ApiOkResponse({ description: 'Passes visible to the authenticated account.' })
  getPasses(@Req() req: Request) {
    return this.billing.getPasses(accountIdOf(req));
  }

  @Get('transactions')
  @ApiQuery({ name: 'subscriptionId', type: Number, required: false })
  getTransactions(
    @Req() req: Request,
    @Query('subscriptionId') subscriptionId?: string,
  ) {
    const subId = subscriptionId ? Number(subscriptionId) : undefined;
    return this.billing.getTransactions(accountIdOf(req), subId);
  }

  @Get('mandate')
  @ApiQuery({ name: 'subscriptionId', type: Number })
  getMandate(
    @Req() req: Request,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.billing.getMandate(accountIdOf(req), subscriptionId);
  }

  @Get('mandate/document')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiQuery({ name: 'subscriptionId', type: Number })
  getMandateDocument(
    @Req() req: Request,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.billing.getMandateDocumentHtml(accountIdOf(req), subscriptionId);
  }

  @Get('payment-method')
  @ApiQuery({ name: 'subscriptionId', type: Number })
  getPaymentMethod(
    @Req() req: Request,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.billing.getPaymentMethod(accountIdOf(req), subscriptionId);
  }

  @Post('payment-method/change')
  @ApiQuery({ name: 'subscriptionId', type: Number })
  startRibChange(
    @Req() req: Request,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.billing.startRibChange(accountIdOf(req), subscriptionId);
  }

  @Post('payment-method/finalize')
  @ApiQuery({ name: 'subscriptionId', type: Number })
  @ApiQuery({ name: 'setupIntentId', type: String })
  finalizeRibChange(
    @Req() req: Request,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
    @Query('setupIntentId') setupIntentId: string,
  ) {
    return this.billing.finalizeRibChange(
      accountIdOf(req),
      subscriptionId,
      setupIntentId,
    );
  }
}