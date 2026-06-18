import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import {
  subscriptionInclude,
  SubscriptionWithRelations,
} from './subscriptions.type';

export type SubscriptionRole = 'titulaire' | 'payeur' | 'gestionnaire';

export interface SubscriptionWithRoles {
  id: number;
  navigoNumber: string;
  subscriptionType: string;
  transportProductId: number | null;
  startDate: Date;
  endDate: Date;
  status: string;
  roles: SubscriptionRole[];
  beneficiary: { id: number; firstName: string; lastName: string };
  latestPayment: { amount: number; paidAt: Date; status: string } | null;
}

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    const existing = await this.findExistingSubscriptionForPlan(
      createSubscriptionDto.beneficiaryId,
      createSubscriptionDto.subscriptionType,
      createSubscriptionDto.transportProductId,
    );

    if (existing) {
      const isCurrentlyActive =
        existing.status === 'active' && existing.endDate >= new Date();

      if (isCurrentlyActive) {
        throw new ConflictException(
          `Ce bénéficiaire a déjà un abonnement actif pour la formule "${createSubscriptionDto.subscriptionType}" (jusqu'au ${existing.endDate.toLocaleDateString('fr-FR')}). Choisissez une autre formule.`,
        );
      }

      // Abonnement existant pour cette même formule, mais inactif ou
      // expiré : on le réactive avec les nouvelles dates plutôt que de
      // créer un doublon. On garde volontairement le même navigoNumber
      // (même "carte"/référence) — celui généré côté front pour cette
      // soumission est simplement ignoré dans ce cas.
      return this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          startDate: createSubscriptionDto.startDate,
          endDate: createSubscriptionDto.endDate,
          referrerId: createSubscriptionDto.referrerId,
          payerId: createSubscriptionDto.payerId,
        },
      });
    }

    return this.prisma.subscription.create({
      data: createSubscriptionDto,
    });
  }

  private async findExistingSubscriptionForPlan(
    beneficiaryId: number,
    subscriptionType: string,
    transportProductId?: number,
  ) {
    const plan = transportProductId
      ? await this.prisma.transportProduct.findUnique({
          where: { id: transportProductId },
          select: { id: true, isAnnualPlan: true },
        })
      : await this.prisma.transportProduct.findUnique({
          where: { name: subscriptionType },
          select: { id: true, isAnnualPlan: true },
        });
    if (!plan?.isAnnualPlan) return null;

    return this.prisma.subscription.findFirst({
      where: {
        beneficiaryId,
        OR: [{ transportProductId: plan.id }, { subscriptionType }],
      },
      orderBy: { endDate: 'desc' },
    });
  }

  async findAll(): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      include: this.includeClause(),
    });

    return subscriptions.map((s) => this.toResponseDto(s));
  }

  async findOne(id: number): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: this.includeClause(),
    });

    if (!subscription) {
      throw new NotFoundException(`Abonnement ${id} introuvable`);
    }

    return this.toResponseDto(subscription);
  }

  async update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {
    await this.ensureExists(id);

    return this.prisma.subscription.update({
      where: { id },
      data: updateSubscriptionDto,
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);

    return this.prisma.subscription.delete({ where: { id } });
  }

  async renew(id: number, startDateInput: string) {
    await this.ensureExists(id);

    const startDate = new Date(startDateInput);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 12);

    return this.prisma.subscription.update({
      where: { id },
      data: { status: 'active', startDate, endDate },
    });
  }

  private async ensureExists(id: number) {
    const exists = await this.prisma.subscription.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Abonnement ${id} introuvable`);
    }
  }

  private includeClause() {
    return subscriptionInclude;
  }

  private toResponseDto(
    subscription: SubscriptionWithRelations,
  ): SubscriptionResponseDto {
    const beneficiary = subscription.beneficiary;
    const account = beneficiary.account;

    return {
      id: subscription.id,
      navigoNumber: subscription.navigoNumber,
      subscriptionType: subscription.subscriptionType,
      transportProductId: subscription.transportProductId,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      status: subscription.status,
      clientNumber: account?.accountNumber ?? '',
      renewed: false, // TODO: champ absent du schéma pour l'instant

      beneficiary: {
        id: beneficiary.id,
        firstName: beneficiary.firstName,
        lastName: beneficiary.lastName,
        email: beneficiary.email,
        birthDate: beneficiary.birthDate.toISOString(),
        residenceDepartment: { name: beneficiary.residenceDepartment.name },
      },

      account: account ? { email: account.email } : null,

      referrer: subscription.referrer
        ? {
            id: subscription.referrer.id,
            email: subscription.referrer.email,
            accountNumber: subscription.referrer.accountNumber,
            beneficiary: subscription.referrer.beneficiary
              ? {
                  firstName: subscription.referrer.beneficiary.firstName,
                  lastName: subscription.referrer.beneficiary.lastName,
                }
              : null,
          }
        : null,

      payer: subscription.payer
        ? {
            id: subscription.payer.id,
            email: subscription.payer.email,
            accountNumber: subscription.payer.accountNumber,
            beneficiary: subscription.payer.beneficiary
              ? {
                  firstName: subscription.payer.beneficiary.firstName,
                  lastName: subscription.payer.beneficiary.lastName,
                }
              : null,
          }
        : null,

      payments: subscription.payments.map((p) => ({
        id: p.id,
        paidAt: p.paidAt.toISOString(),
        amount: p.amount,
        method: p.method,
        status: p.status,
      })),

      // Pas encore de modèle Prisma pour ces deux entités
      documents: [],
      delivery: null,
    };
  }

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
        transportProductId: sub.transportProductId,
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