import {
  Controller,
  Get,
  Header,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { BillingService } from './billing.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetMe } from 'src/auth/decorators/get-me.decorator';
import type { JwtPayload } from 'src/auth/types';

function accountIdOf(user: JwtPayload): number {
  return user.id;
}

@ApiTags('Billing')
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('passes')
  @ApiOkResponse({
    description: 'Passes visible to the authenticated account.',
  })
  getPasses(@GetMe() user: JwtPayload) {
    return this.billing.getPasses(accountIdOf(user));
  }

  @Get('transactions')
  @ApiQuery({ name: 'subscriptionId', type: Number, required: false })
  getTransactions(
    @GetMe() user: JwtPayload,
    @Query('subscriptionId') subscriptionId?: string,
  ) {
    const subId = subscriptionId ? Number(subscriptionId) : undefined;
    return this.billing.getTransactions(accountIdOf(user), subId);
  }

  @Get('mandate')
  @ApiQuery({ name: 'subscriptionId', type: Number })
  getMandate(
    @GetMe() user: JwtPayload,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.billing.getMandate(accountIdOf(user), subscriptionId);
  }

  @Get('mandate/document')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiQuery({ name: 'subscriptionId', type: Number })
  getMandateDocument(
    @GetMe() user: JwtPayload,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.billing.getMandateDocumentHtml(
      accountIdOf(user),
      subscriptionId,
    );
  }

  @Get('payment-method')
  @ApiQuery({ name: 'subscriptionId', type: Number })
  getPaymentMethod(
    @GetMe() user: JwtPayload,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.billing.getPaymentMethod(accountIdOf(user), subscriptionId);
  }

  @Post('payment-method/change')
  @ApiQuery({ name: 'subscriptionId', type: Number })
  startRibChange(
    @GetMe() user: JwtPayload,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.billing.startRibChange(accountIdOf(user), subscriptionId);
  }

  @Post('payment-method/finalize')
  @ApiQuery({ name: 'subscriptionId', type: Number })
  @ApiQuery({ name: 'setupIntentId', type: String })
  finalizeRibChange(
    @GetMe() user: JwtPayload,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
    @Query('setupIntentId') setupIntentId: string,
  ) {
    return this.billing.finalizeRibChange(
      accountIdOf(user),
      subscriptionId,
      setupIntentId,
    );
  }
}
