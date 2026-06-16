import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  BillingRole,
  PassSummary,
  Transaction,
  TransactionsResponse,
  TransactionStatus,
} from './dto/billing.types';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every subscription the account can see in its billing space:
   *  - passes it pays         (payerId)
   *  - passes it refers        (referrerId)
   *  - its own pass            (beneficiary.account === account)
   */
  private async getVisibleSubscriptions(accountId: number) {
    const subs = await this.prisma.subscription.findMany({
      where: {
        OR: [
          { payerId: accountId },
          { referrerId: accountId },
          { beneficiary: { account: { id: accountId } } },
        ],
      },
      include: {
        beneficiary: { include: { account: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    return subs.map((sub) => {
      const roles: BillingRole[] = [];
      if (sub.beneficiary.account?.id === accountId) roles.push('holder');
      if (sub.referrerId === accountId) roles.push('referrer');
      if (sub.payerId === accountId) roles.push('payer');
      return { sub, roles };
    });
  }

  async getPasses(accountId: number): Promise<PassSummary[]> {
    const visible = await this.getVisibleSubscriptions(accountId);
    return visible.map(({ sub, roles }) => ({
      subscriptionId: sub.id,
      navigoNumber: sub.navigoNumber,
      subscriptionType: sub.subscriptionType,
      status: sub.status,
      holderName: `${sub.beneficiary.firstName} ${sub.beneficiary.lastName}`,
      roles,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
    }));
  }

  /**
   * Transaction history for the account, optionally scoped to one pass.
   * Passing a `subscriptionId` the account cannot see → 403.
   */
  async getTransactions(
    accountId: number,
    subscriptionId?: number,
  ): Promise<TransactionsResponse> {
    const visible = await this.getVisibleSubscriptions(accountId);
    const visibleIds = new Set(visible.map((v) => v.sub.id));

    if (subscriptionId !== undefined && !visibleIds.has(subscriptionId)) {
      throw new ForbiddenException(
        `Pass ${subscriptionId} is not linked to this account.`,
      );
    }

    const targetIds = subscriptionId ? [subscriptionId] : [...visibleIds];

    if (targetIds.length === 0) {
      return { total: 0, currency: 'EUR', transactions: [] };
    }

    const payments = await this.prisma.payment.findMany({
      where: { subscriptionId: { in: targetIds } },
      include: { subscription: { include: { beneficiary: true } } },
      orderBy: { paidAt: 'desc' },
    });

    const transactions: Transaction[] = payments.map((p) => {
      const status = this.normalizeStatus(p.status);
      // A debit leaves the account → negative; a refund comes back → positive.
      const signedAmount =
        status === 'refunded' ? Math.abs(p.amount) : -Math.abs(p.amount);
      const holder = p.subscription.beneficiary;
      return {
        id: String(p.id),
        date: p.paidAt.toISOString(),
        label: `${p.subscription.subscriptionType} — ${holder.firstName} ${holder.lastName}`,
        amount: Number(signedAmount.toFixed(2)),
        status,
        method: p.method,
        navigoNumber: p.subscription.navigoNumber,
      };
    });

    // Only settled movements count towards the net total (failed ≠ debited).
    const total = transactions
      .filter((t) => t.status !== 'failed')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      total: Number(total.toFixed(2)),
      currency: 'EUR',
      transactions,
    };
  }

  private normalizeStatus(raw: string): TransactionStatus {
    switch (raw) {
      case 'failed':
        return 'failed';
      case 'refunded':
        return 'refunded';
      default:
        return 'succeeded';
    }
  }

  /** Guards that the account may access the given pass; throws otherwise. */
  async assertCanAccessPass(accountId: number, subscriptionId: number) {
    const visible = await this.getVisibleSubscriptions(accountId);
    const found = visible.find((v) => v.sub.id === subscriptionId);
    if (!found) {
      throw new NotFoundException(
        `Pass ${subscriptionId} not found for this account.`,
      );
    }
    return found;
  }
}