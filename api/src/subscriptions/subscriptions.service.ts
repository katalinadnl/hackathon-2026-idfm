import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    return this.prisma.subscription.create({
      data: createSubscriptionDto,
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

  private async ensureExists(id: number) {
    const exists = await this.prisma.subscription.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Abonnement ${id} introuvable`);
    }
  }

  // Include partagé entre findAll et findOne pour rester cohérent
  private includeClause() {
    return {
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
    };
  }

  private toResponseDto(subscription: any): SubscriptionResponseDto {
    const beneficiary = subscription.beneficiary;
    const account = beneficiary.account;

    return {
      id: subscription.id,
      navigoNumber: subscription.navigoNumber,
      subscriptionType: subscription.subscriptionType,
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

      payments: subscription.payments.map((p: any) => ({
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
}
