import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  subscriptionInclude,
  SubscriptionWithRelations,
} from './subscriptions.type';
import { ReportLostOrStolenDto } from './dto/report-lost-or-stolen.dto';
import { AddressType, PassStatus } from 'src/generated/prisma/enums';
import { SubscriptionResponse } from './dto/subscription-response.dto';

export type SubscriptionRole = 'titulaire' | 'payeur' | 'gestionnaire';

export interface SubscriptionWithRoles {
  id: number;
  navigoNumber: string | null;
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
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SubscriptionResponse[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      include: this.includeClause(),
    });

    return subscriptions.map((s) => this.toResponseDto(s));
  }

  async findOne(id: number): Promise<SubscriptionResponse> {
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

  private includeClause() {
    return subscriptionInclude;
  }

  private toResponseDto(
    subscription: SubscriptionWithRelations,
  ): SubscriptionResponse {
    const beneficiary = subscription.beneficiary;
    const account = beneficiary.account;

    return {
      id: subscription.id,
      bankInfo: subscription.bankInfo,
      passes: subscription.passes.map((pass) => {
        if (!pass.delivery) {
          throw new Error(
            `Incohérence de données : le pass ${pass.id} n'a pas de livraison associée.`,
          );
        }
        return {
          id: pass.id,
          navigoNumber: pass.navigoNumber,
          status: pass.status,
          issuedAt: pass.issuedAt.toISOString(),
          delivery: {
            status: pass.delivery.status,
            reason: pass.delivery.reason,
            orderedAt: pass.delivery.orderedAt.toISOString(),
            estimatedAt: pass.delivery.estimatedAt?.toISOString() ?? null,
            trackingNumber: pass.delivery.trackingNumber,
          },
        };
      }),
      subscriptionType: subscription.subscriptionType,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      clientNumber: account?.accountNumber ?? '',
      status: subscription.status,
      renewed: false,
      beneficiary: {
        id: beneficiary.id,
        firstName: beneficiary.firstName,
        lastName: beneficiary.lastName,
        email: beneficiary.email,
        birthDate: beneficiary.birthDate.toISOString(),
        residenceDepartment: { name: beneficiary.residenceDepartment.name },
        addresses: beneficiary.addresses.map((a) => ({
          id: a.id,
          type: a.type,
          isDefault: a.isDefault,
          line1: a.line1,
          line2: a.line2,
          city: a.city,
          postalCode: a.postalCode,
          country: a.country,
        })),
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

      payments: subscription.payments.map((p) => ({
        id: p.id,
        paidAt: p.paidAt.toISOString(),
        amount: p.amount,
        method: p.method,
        status: p.status,
      })),
      documents: [],
    };
  }

  async findByAccount(accountId: number): Promise<SubscriptionWithRoles[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        OR: [
          { referrerId: accountId },
          { beneficiary: { account: { id: accountId } } },
        ],
      },
      include: {
        beneficiary: { include: { account: { select: { id: true } } } },
        payments: { orderBy: { paidAt: 'desc' }, take: 1 },
        passes: { where: { status: PassStatus.active }, take: 1 },
        bankInfo: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return subscriptions.map((sub) => {
      const roles: SubscriptionRole[] = [];
      if (sub.beneficiary.account?.id === accountId) roles.push('titulaire');
      if (sub.referrerId === accountId) roles.push('gestionnaire');
      if (sub.bankInfo.accountId === accountId) roles.push('payeur');
      return {
        id: sub.id,
        navigoNumber: sub.passes[0]?.navigoNumber ?? null,
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

  /**
   * Signale un pass perdu/volé/endommagé :
   * - bloque le PASS actif actuel (pas l'abonnement, qui continue de courir)
   * - émet un nouveau pass actif en remplacement
   * - crée une livraison pour ce nouveau pass, vers une adresse existante ou
   *   une adresse nouvellement créée (type "delivery") si dto.newAddress est fourni
   *
   * Autorisé pour le bénéficiaire (titulaire) lui-même OU le référant.
   */
  async reportLostOrStolen(
    subscriptionId: number,
    requesterAccountId: number,
    dto: ReportLostOrStolenDto,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        beneficiary: {
          include: {
            account: true,
            addresses: true,
          },
        },
        passes: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Abonnement ${subscriptionId} introuvable`);
    }

    const isBeneficiaryAccount =
      subscription.beneficiary.account?.id === requesterAccountId;
    const isReferrer = subscription.referrerId === requesterAccountId;

    if (!isBeneficiaryAccount && !isReferrer) {
      throw new ForbiddenException(
        'Seul le titulaire ou le référant peut signaler ce pass.',
      );
    }

    const activePass = subscription.passes.find(
      (p) => p.status === PassStatus.active,
    );

    if (!activePass) {
      throw new BadRequestException(
        'Aucun pass actif à bloquer pour cet abonnement.',
      );
    }

    if (!dto.addressId && !dto.newAddress) {
      const fallback = this.resolveDeliveryAddress(
        subscription.beneficiary.addresses,
      );
      if (!fallback) {
        throw new BadRequestException(
          'Aucune adresse disponible. Renseignez une adresse pour la livraison.',
        );
      }
      dto.addressId = fallback.id;
    }

    if (dto.addressId) {
      const exists = subscription.beneficiary.addresses.some(
        (a) => a.id === dto.addressId,
      );
      if (!exists) {
        throw new BadRequestException(
          "Cette adresse n'appartient pas au bénéficiaire.",
        );
      }
    }

    const beneficiaryId = subscription.beneficiary.id;

    const [blockedPass, newPass, address] = await this.prisma.$transaction(
      async (tx) => {
        // 1. Bloque le pass actuel (plus jamais "active")
        const blocked = await tx.pass.update({
          where: { id: activePass.id },
          data: { status: PassStatus.blocked },
        });

        // 2. Résout ou crée l'adresse de livraison
        const resolvedAddress = dto.addressId
          ? await tx.address.findUniqueOrThrow({
              where: { id: dto.addressId },
            })
          : await tx.address.create({
              data: {
                beneficiaryId,
                type: AddressType.delivery,
                isDefault: false,
                line1: dto.newAddress!.line1,
                line2: dto.newAddress!.line2,
                city: dto.newAddress!.city,
                postalCode: dto.newAddress!.postalCode,
              },
            });

        // 3. Émet le pass de remplacement — un seul pass actif par abonnement
        const replacement = await tx.pass.create({
          data: {
            subscriptionId,
            navigoNumber: this.generateNavigoNumber(),
            status: PassStatus.active,
            delivery: {
              create: {
                addressId: resolvedAddress.id,
                reason: dto.reason,
                estimatedAt: this.addBusinessDays(new Date(), 7),
              },
            },
          },
          include: { delivery: true },
        });
        return [blocked, replacement, resolvedAddress];
      },
    );

    return {
      blockedPass,
      newPass,
      address,
    };
  }

  /**
   * Choix par défaut quand ni addressId ni newAddress ne sont fournis :
   * 1. adresse "home" marquée par défaut
   * 2. sinon n'importe quelle adresse "home"
   * 3. sinon n'importe quelle adresse "delivery"
   */
  private resolveDeliveryAddress(
    addresses: { id: number; type: string; isDefault: boolean }[],
  ) {
    const homeDefault = addresses.find((a) => a.type === 'home' && a.isDefault);
    if (homeDefault) return homeDefault;

    const anyHome = addresses.find((a) => a.type === 'home');
    if (anyHome) return anyHome;

    return addresses.find((a) => a.type === 'delivery') ?? null;
  }

  private addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) added++;
    }
    return result;
  }

  private generateNavigoNumber(): string {
    const random = Math.floor(Math.random() * 1_000_000_000)
      .toString()
      .padStart(9, '0');
    return `NAV-${random}`;
  }

  /**
   * Dissocie le référant d'un abonnement (referrerId -> null).
   * Autorisé pour le référant actuel lui-même OU le titulaire (bénéficiaire).
   */
  async unlinkReferrer(subscriptionId: number, requesterAccountId: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { beneficiary: { include: { account: true } } },
    });

    if (!subscription) {
      throw new NotFoundException(`Abonnement ${subscriptionId} introuvable`);
    }

    const isBeneficiaryAccount =
      subscription.beneficiary.account?.id === requesterAccountId;
    const isCurrentReferrer = subscription.referrerId === requesterAccountId;

    if (!isBeneficiaryAccount && !isCurrentReferrer) {
      throw new ForbiddenException(
        'Seul le titulaire ou le référant actuel peut dissocier ce compte.',
      );
    }

    if (subscription.referrerId === null) {
      throw new BadRequestException('Aucun référant à dissocier.');
    }

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { referrerId: null },
    });
  }

  /**
   * Associe un nouveau référant à l'abonnement. Autorisé pour le titulaire
   * (bénéficiaire) ou le référant actuel (pour se remplacer lui-même).
   * Refuse si un référant existe déjà — il faut d'abord le dissocier.
   */
  async assignReferrer(
    subscriptionId: number,
    requesterAccountId: number,
    newReferrerAccountId: number,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { beneficiary: { include: { account: true } } },
    });

    if (!subscription) {
      throw new NotFoundException(`Abonnement ${subscriptionId} introuvable`);
    }

    const isBeneficiaryAccount =
      subscription.beneficiary.account?.id === requesterAccountId;
    const isCurrentReferrer = subscription.referrerId === requesterAccountId;

    if (!isBeneficiaryAccount && !isCurrentReferrer) {
      throw new ForbiddenException(
        'Seul le titulaire ou le référant actuel peut modifier ce champ.',
      );
    }

    if (subscription.referrerId !== null) {
      throw new BadRequestException(
        "Un référant est déjà associé. Dissociez-le avant d'en ajouter un nouveau.",
      );
    }

    const newReferrer = await this.prisma.account.findUnique({
      where: { id: newReferrerAccountId },
    });

    if (!newReferrer) {
      throw new NotFoundException('Compte introuvable.');
    }

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { referrerId: newReferrerAccountId },
    });
  }

  /**
   * Résilie un abonnement, conformément aux CGU IDFM :
   * - aucun préavis nécessaire pour la demande
   * - le mois en cours reste dû dans son intégralité
   * - la résiliation ne prend effet qu'au 1er jour du mois suivant
   *
   * Le statut passe immédiatement à "pending_cancellation" (visible par
   * l'utilisateur), puis un job planifié devra repasser le statut à
   * "cancelled" une fois cancellationEffectiveAt atteint.
   *
   * Le pass actif est bloqué dès la demande — conformément à la consigne
   * métier, indépendamment de la date d'effet de la résiliation contractuelle.
   */
  async cancelSubscription(subscriptionId: number, requesterAccountId: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        beneficiary: { include: { account: true } },
        passes: { where: { status: PassStatus.active } },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Abonnement ${subscriptionId} introuvable`);
    }

    const isBeneficiaryAccount =
      subscription.beneficiary.account?.id === requesterAccountId;
    const isReferrer = subscription.referrerId === requesterAccountId;

    if (!isBeneficiaryAccount && !isReferrer) {
      throw new ForbiddenException(
        'Seul le titulaire ou le référant peut résilier cet abonnement.',
      );
    }

    if (subscription.status !== 'active') {
      throw new BadRequestException(
        'Cet abonnement ne peut pas être résilié dans son état actuel.',
      );
    }

    const now = new Date();
    const effectiveAt = this.firstDayOfNextMonth(now);
    const activePasses = subscription.passes ?? null;

    const [updatedSubscription] = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'pending_cancellation',
          cancelledAt: now,
          cancellationEffectiveAt: effectiveAt,
          cancelledById: requesterAccountId,
        },
      });

      if (activePasses) {
        await Promise.all(
          activePasses.map((pass) =>
            tx.pass.update({
              where: { id: pass.id },
              data: { status: PassStatus.blocked },
            }),
          ),
        );
      }
      return [updated];
    });

    return updatedSubscription;
  }

  private firstDayOfNextMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  }
}
