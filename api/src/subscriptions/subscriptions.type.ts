import { Prisma } from 'src/generated/prisma/client';

export const subscriptionInclude = {
  beneficiary: {
    include: {
      residenceDepartment: true,
      addresses: true,
      accountReferant: true,
      accountTitulaire: true,
    },
  },
  bankInfo: true,
  payments: {
    orderBy: { paidAt: 'desc' as const },
  },
  passes: {
    orderBy: { issuedAt: 'desc' as const },
    where: { NOT: { status: 'blocked' } },
    include: { delivery: true },
    take: 1,
  },
} satisfies Prisma.SubscriptionInclude;

export type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
  include: typeof subscriptionInclude;
}>;
