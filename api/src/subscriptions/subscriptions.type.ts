import { Prisma } from 'src/generated/prisma/client';

export const subscriptionInclude = {
  beneficiary: {
    include: {
      residenceDepartment: true,
      account: true,
    },
  },
  referrer: {
    include: { beneficiary: true },
  },
  payer: {
    include: { beneficiary: true },
  },
  payments: {
    orderBy: { paidAt: 'desc' as const },
  },
} satisfies Prisma.SubscriptionInclude;

export type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
  include: typeof subscriptionInclude;
}>;
