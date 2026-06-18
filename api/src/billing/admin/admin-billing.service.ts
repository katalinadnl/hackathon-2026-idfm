import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { StripeProvider } from '../stripe/stripe.provider';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';

interface PaginationOpts {
  page: number;
  limit: number;
}

interface SubscriptionFilters extends PaginationOpts {
  search?: string;
  status?: string;
  type?: string;
}

interface PaymentFilters extends PaginationOpts {
  status?: string;
  subscriptionId?: number;
  from?: string;
  to?: string;
}

@Injectable()
export class AdminBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeProvider,
    private readonly subscriptionService: SubscriptionsService,
  ) {}

  // ── #57 : Subscriptions ───────────────────────────────────────────────────

  async listSubscriptions(filters: SubscriptionFilters) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.type) {
      where.subscriptionType = { contains: filters.type, mode: 'insensitive' };
    }
    if (filters.search) {
      where.OR = [
        // navigoNumber vit sur Pass désormais, pas directement sur Subscription
        {
          passes: {
            some: {
              navigoNumber: { contains: filters.search, mode: 'insensitive' },
            },
          },
        },
        {
          beneficiary: {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        include: {
          beneficiary: true,
          bankInfo: { include: { account: true } },
          passes: { include: { delivery: true } },
          _count: { select: { payments: true } },
        },
        orderBy: { startDate: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      items: items.map((sub) => {
        const activePass = this.subscriptionService.getActivePass(sub.passes);
        return {
          id: sub.id,
          navigoNumber: activePass?.navigoNumber ?? null,
          subscriptionType: sub.subscriptionType,
          status: sub.status,
          startDate: sub.startDate.toISOString(),
          endDate: sub.endDate.toISOString(),
          beneficiary: {
            id: sub.beneficiary.id,
            name: `${sub.beneficiary.firstName} ${sub.beneficiary.lastName}`,
          },
          bankInfo: sub.bankInfo,
          paymentCount: sub._count.payments,
        };
      }),
      total,
      page: filters.page,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async getSubscriptionDetail(id: number) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        beneficiary: true,
        bankInfo: {
          include: { account: true },
        },
        payments: { orderBy: { paidAt: 'desc' } },
        passes: { include: { delivery: true } },
      },
    });
    if (!sub) throw new NotFoundException(`Subscription ${id} not found`);

    const totalPaid = sub.payments
      .filter((p) => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalFailed = sub.payments
      .filter((p) => p.status === 'failed')
      .reduce((sum, p) => sum + p.amount, 0);

    const activePass = this.subscriptionService.getActivePass(sub.passes);

    return {
      ...sub,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
      navigoNumber: activePass?.navigoNumber ?? null,
      summary: {
        totalPaid: Number(totalPaid.toFixed(2)),
        totalFailed: Number(totalFailed.toFixed(2)),
        paymentCount: sub.payments.length,
        failedCount: sub.payments.filter((p) => p.status === 'failed').length,
      },
    };
  }

  // ── #59 : Payments ────────────────────────────────────────────────────────

  async listPayments(filters: PaymentFilters) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }
    if (filters.from || filters.to) {
      where.paidAt = {};
      if (filters.from) where.paidAt.gte = new Date(filters.from);
      if (filters.to) where.paidAt.lte = new Date(filters.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          subscription: {
            include: {
              beneficiary: true,
              bankInfo: { include: { account: true } },
              passes: { where: { status: 'active' } },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: items.map((p) => {
        const activePass = this.subscriptionService.getActivePass(
          p.subscription.passes,
        );
        return {
          id: p.id,
          amount: p.amount,
          status: p.status,
          method: p.method,
          paidAt: p.paidAt.toISOString(),
          subscription: {
            id: p.subscription.id,
            navigoNumber: activePass?.navigoNumber ?? null,
            subscriptionType: p.subscription.subscriptionType,
            beneficiaryName: `${p.subscription.beneficiary.firstName} ${p.subscription.beneficiary.lastName}`,
          },
          // "payeur" est désormais le compte propriétaire du BankInfo utilisé,
          // une information dérivée, plus une relation directe sur Subscription.
          payer: p.subscription.bankInfo
            ? {
                id: p.subscription.bankInfo.account.id,
                email: p.subscription.bankInfo.account.email,
              }
            : null,
        };
      }),
      total,
      page: filters.page,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  // ── #58 : Unpaid ──────────────────────────────────────────────────────────

  async listUnpaidPayments(opts: PaginationOpts) {
    return this.listPayments({ ...opts, status: 'failed' });
  }

  async markPaymentResolved(paymentId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    if (payment.status !== 'failed') {
      throw new BadRequestException('Only failed payments can be resolved');
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'succeeded' },
    });

    return { ok: true, message: 'Paiement marqué comme résolu.' };
  }

  async retryPayment(paymentId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    if (payment.status !== 'failed') {
      throw new BadRequestException('Only failed payments can be retried');
    }

    if (this.stripe.isConnected) {
      const result = await this.stripe.retryPayment(
        payment.subscriptionId,
        payment.amount,
      );
      if (result.ok) {
        await this.prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'succeeded' },
        });
        return { ok: true, message: 'Prélèvement relancé avec succès.' };
      }
      return { ok: false, message: result.error ?? 'Échec de la relance.' };
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'succeeded' },
    });
    return { ok: true, message: 'Paiement marqué comme réglé (mode local).' };
  }

  // ── #49 : Mandats ────────────────────────────────────────────────────────

  async getAccountMandate(accountId: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { beneficiariesReferant: true, beneficiaryTitulaire: true },
    });
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);

    return {
      accountId: account.id,
      email: account.email,
      beneficiariesReferant: account.beneficiariesReferant,
      beneficiaryTitulaire: account.beneficiaryTitulaire,
      stripeCustomerId: account.stripeCustomerId,
      stripePaymentMethodId: account.stripePaymentMethodId,
      stripeMandateId: account.stripeMandateId,
      stripePreviousMandateId: account.stripePreviousMandateId,
      hasActiveMandate: Boolean(account.stripeMandateId),
    };
  }

  async revokeMandate(accountId: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);

    if (!account.stripeMandateId && !account.stripePaymentMethodId) {
      throw new BadRequestException('No active mandate to revoke');
    }

    if (this.stripe.isConnected && account.stripeMandateId) {
      try {
        const stripe = this.stripe['getClient']();
        if (account.stripePaymentMethodId) {
          await stripe.paymentMethods.detach(account.stripePaymentMethodId);
        }
      } catch {
        // proceed with local cleanup even if Stripe call fails
      }
    }

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        stripePreviousMandateId: account.stripeMandateId,
        stripeMandateId: null,
        stripePaymentMethodId: null,
      },
    });

    return { ok: true, message: 'Mandat SEPA révoqué.' };
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats() {
    const [
      totalSubscriptions,
      activeSubscriptions,
      totalPayments,
      failedPayments,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: 'active' } }),
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: 'failed' } }),
      this.prisma.payment.aggregate({
        where: { status: 'succeeded' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalSubscriptions,
      activeSubscriptions,
      totalPayments,
      failedPayments,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    };
  }
}
