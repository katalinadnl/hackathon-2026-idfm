import {
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { BillingService } from './billing.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { MandatePdfService } from './mandate-pdf.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetMe } from 'src/auth/decorators/get-me.decorator';
import type { JwtPayload } from 'src/auth/types';

function accountIdOf(user: JwtPayload): number {
  return user.id;
}

function optionalInt(value?: string): number | undefined {
  return value ? Number(value) : undefined;
}

@ApiTags('Billing')
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly invoicePdf: InvoicePdfService,
    private readonly mandatePdf: MandatePdfService,
  ) {}

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
    return this.billing.getTransactions(
      accountIdOf(user),
      optionalInt(subscriptionId),
    );
  }

  @Get('mandate')
  @ApiQuery({ name: 'subscriptionId', type: Number, required: false })
  getMandate(
    @GetMe() user: JwtPayload,
    @Query('subscriptionId') subscriptionId?: string,
  ) {
    return this.billing.getMandate(
      accountIdOf(user),
      optionalInt(subscriptionId),
    );
  }

  @Get('mandate/document')
  @ApiQuery({ name: 'subscriptionId', type: Number })
  @ApiQuery({ name: 'format', type: String, required: false })
  async getMandateDocument(
    @GetMe() user: JwtPayload,
    @Query('subscriptionId', ParseIntPipe) subscriptionId: number,
    @Query('format') format: string | undefined,
    @Res() res: Response,
  ) {
    if (format === 'html') {
      const html = await this.billing.getMandateDocumentHtml(
        accountIdOf(user),
        subscriptionId,
      );
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
      return;
    }

    const { active } = await this.billing.getMandate(
      accountIdOf(user),
      subscriptionId,
    );
    if (!active) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(
        '<!doctype html><meta charset="utf-8"><p>Aucun mandat disponible pour ce pass.</p>',
      );
      return;
    }

    const pdf = await this.mandatePdf.generate(active);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="mandat-sepa-${active.reference}.pdf"`,
    );
    res.send(pdf);
  }

  @Get('invoice/month')
  @ApiQuery({ name: 'month', type: String })
  async getMonthInvoice(
    @GetMe() user: JwtPayload,
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const items = await this.billing.getMonthInvoiceData(
      accountIdOf(user),
      month,
    );
    const monthLabel = new Date(`${month}-01`).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
    const pdf = await this.invoicePdf.generateGrouped(items, monthLabel);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="facture-${month}.pdf"`,
    );
    res.send(pdf);
  }

  @Get('invoice')
  @ApiQuery({ name: 'paymentId', type: Number })
  async getInvoice(
    @GetMe() user: JwtPayload,
    @Query('paymentId', ParseIntPipe) paymentId: number,
    @Res() res: Response,
  ) {
    const data = await this.billing.getInvoiceData(
      accountIdOf(user),
      paymentId,
    );
    const pdf = await this.invoicePdf.generate(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="facture-${data.invoiceNumber}.pdf"`,
    );
    res.send(pdf);
  }

  @Get('payment-method')
  @ApiQuery({ name: 'subscriptionId', type: Number, required: false })
  getPaymentMethod(
    @GetMe() user: JwtPayload,
    @Query('subscriptionId') subscriptionId?: string,
  ) {
    return this.billing.getPaymentMethod(
      accountIdOf(user),
      optionalInt(subscriptionId),
    );
  }

  @Post('payment/retry')
  @ApiQuery({ name: 'paymentId', type: Number })
  retryPayment(
    @GetMe() user: JwtPayload,
    @Query('paymentId', ParseIntPipe) paymentId: number,
  ) {
    return this.billing.retryPayment(accountIdOf(user), paymentId);
  }

  @Post('payment/pay-by-card')
  @ApiQuery({ name: 'paymentId', type: Number })
  payByCard(
    @GetMe() user: JwtPayload,
    @Query('paymentId', ParseIntPipe) paymentId: number,
  ) {
    const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:8081';
    return this.billing.payByCard(accountIdOf(user), paymentId, baseUrl);
  }

  @Post('payment-method/change')
  @ApiQuery({ name: 'subscriptionId', type: Number, required: false })
  startRibChange(
    @GetMe() user: JwtPayload,
    @Query('subscriptionId') subscriptionId?: string,
  ) {
    return this.billing.startRibChange(
      accountIdOf(user),
      optionalInt(subscriptionId),
    );
  }

  @Post('payment-method/finalize')
  @ApiQuery({ name: 'subscriptionId', type: Number, required: false })
  @ApiQuery({ name: 'setupIntentId', type: String })
  finalizeRibChange(
    @GetMe() user: JwtPayload,
    @Query('subscriptionId') subscriptionId: string | undefined,
    @Query('setupIntentId') setupIntentId: string,
  ) {
    return this.billing.finalizeRibChange(
      accountIdOf(user),
      optionalInt(subscriptionId),
      setupIntentId,
    );
  }
}
