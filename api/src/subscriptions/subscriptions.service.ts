import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type SubscriptionRole = 'titulaire' | 'payeur' | 'gestionnaire';

export interface SubscriptionWithRoles {
  id: number;
  navigoNumber: string;
  subscriptionType: string;
  startDate: Date;
  endDate: Date;
  status: string;
  roles: SubscriptionRole[];
  beneficiary: { id: number; firstName: string; lastName: string };
  latestPayment: { amount: number; paidAt: Date; status: string } | null;
}

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async findByAccount(accountId: number): Promise<SubscriptionWithRoles[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        OR: [
          { referrerId: accountId },
          { payerId: accountId },
          { beneficiary: { account: { id: accountId } } },
        ],
      },
      include: {
        beneficiary: { include: { account: { select: { id: true } } } },
        payments: { orderBy: { paidAt: 'desc' }, take: 1 },
      },
      orderBy: { startDate: 'desc' },
    });

    return subscriptions.map((sub) => {
      const roles: SubscriptionRole[] = [];
      if (sub.beneficiary.account?.id === accountId) roles.push('titulaire');
      if (sub.payerId === accountId) roles.push('payeur');
      if (sub.referrerId === accountId) roles.push('gestionnaire');

      return {
        id: sub.id,
        navigoNumber: sub.navigoNumber,
        subscriptionType: sub.subscriptionType,
        startDate: sub.startDate,
        endDate: sub.endDate,
        status: sub.status,
        roles,
        beneficiary: {
          id: sub.beneficiary.id,
          firstName: sub.beneficiary.firstName,
          lastName: sub.beneficiary.lastName,
        },
        latestPayment: sub.payments[0] ?? null,
      };
    });
  }
}