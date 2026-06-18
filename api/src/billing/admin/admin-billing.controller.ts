import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

import { AdminBillingService } from './admin-billing.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Admin / Billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin' as any)
@Controller('admin/billing')
export class AdminBillingController {
  constructor(private readonly admin: AdminBillingService) {}

  // ── #57 : Visualiser et rechercher tous les abonnements ──────────────────
  @Get('subscriptions')
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listSubscriptions(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listSubscriptions({
      search,
      status,
      type,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('subscriptions/:id')
  getSubscription(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getSubscriptionDetail(id);
  }

  // ── #59 : Consulter l'état des prélèvements et paiements directs ────────
  @Get('payments')
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'subscriptionId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listPayments(
    @Query('status') status?: string,
    @Query('subscriptionId') subscriptionId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listPayments({
      status,
      subscriptionId: subscriptionId ? Number(subscriptionId) : undefined,
      from,
      to,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  // ── #58 : Gérer les impayés et anomalies de paiement ────────────────────
  @Get('payments/unpaid')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listUnpaid(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listUnpaidPayments({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post('payments/:id/mark-resolved')
  markPaymentResolved(@Param('id', ParseIntPipe) id: number) {
    return this.admin.markPaymentResolved(id);
  }

  @Post('payments/:id/retry')
  retryPayment(@Param('id', ParseIntPipe) id: number) {
    return this.admin.retryPayment(id);
  }

  // ── #49 : Modifier ou résilier un mandat SEPA d'un utilisateur ──────────
  @Get('accounts/:accountId/mandate')
  getAccountMandate(@Param('accountId', ParseIntPipe) accountId: number) {
    return this.admin.getAccountMandate(accountId);
  }

  @Patch('accounts/:accountId/mandate')
  updateMandate(
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() body: { action: 'revoke' },
  ) {
    return this.admin.revokeMandate(accountId);
  }

  @Get('stats')
  getStats() {
    return this.admin.getStats();
  }
}