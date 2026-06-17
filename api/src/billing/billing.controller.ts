import {
  Controller,
  Get,
  Header,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('passes')
  @ApiQuery({ name: 'accountId', type: Number })
  @ApiOkResponse({ description: 'Passes visible to the account.' })
  getPasses(@Query('accountId', ParseIntPipe) accountId: number) {
    return this.billing.getPasses(accountId);
  }

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

  @Get('mandate')
  @ApiQuery({ name: 'accountId', type: Number })
  @ApiQuery({ name: 'subscriptionId', type: Number })
  getMandate(
    @Query('accountId', ParseIntPipe) accountId: number,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.billing.getMandate(accountId, subscriptionId);
  }

  @Get('mandate/document')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiQuery({ name: 'accountId', type: Number })
  @ApiQuery({ name: 'subscriptionId', type: Number })
  getMandateDocument(
    @Query('accountId', ParseIntPipe) accountId: number,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.billing.getMandateDocumentHtml(accountId, subscriptionId);
  }

  @Get('payment-method')
  @ApiQuery({ name: 'accountId', type: Number })
  @ApiQuery({ name: 'subscriptionId', type: Number })
  getPaymentMethod(
    @Query('accountId', ParseIntPipe) accountId: number,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.billing.getPaymentMethod(accountId, subscriptionId);
  }

  @Post('payment-method/change')
  @ApiQuery({ name: 'accountId', type: Number })
  @ApiQuery({ name: 'subscriptionId', type: Number })
  startRibChange(
    @Query('accountId', ParseIntPipe) accountId: number,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.billing.startRibChange(accountId, subscriptionId);
  }

  @Post('payment-method/finalize')
  @ApiQuery({ name: 'accountId', type: Number })
  @ApiQuery({ name: 'subscriptionId', type: Number })
  @ApiQuery({ name: 'setupIntentId', type: String })
  finalizeRibChange(
    @Query('accountId', ParseIntPipe) accountId: number,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
    @Query('setupIntentId') setupIntentId: string,
  ) {
    return this.billing.finalizeRibChange(
      accountId,
      subscriptionId,
      setupIntentId,
    );
  }
}
