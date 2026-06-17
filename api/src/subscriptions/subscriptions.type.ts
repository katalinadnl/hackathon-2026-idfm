import { Prisma } from 'src/generated/prisma/client';

export const subscriptionInclude = {
  beneficiary: {
    include: {
      residenceDepartment: true,
      account: true,
      addresses: true,
    },
  },
  referrer: {
    include: { beneficiary: true },
  },
  bankInfo: true,
  payments: {
    orderBy: { paidAt: 'desc' as const },
  },
  passes: {
    orderBy: { issuedAt: 'desc' as const },
    where: { NOT: { status: 'blocked' } },
    include: { delivery: true },
  },
} satisfies Prisma.SubscriptionInclude;

export type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
  include: typeof subscriptionInclude;
}>;
