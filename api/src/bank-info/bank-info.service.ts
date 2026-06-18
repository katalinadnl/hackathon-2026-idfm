import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBankInfoDto } from './dto/create-bank-info.dto';
import { UpdateBankInfoDto } from './dto/update-bank-info.dto';

@Injectable()
export class BankInfoService {
  constructor(private readonly prisma: PrismaService) {}

  create(createBankInfoDto: CreateBankInfoDto) {
    return this.prisma.bankInfo.create({ data: createBankInfoDto });
  }

  async findAll(requesterId: number) {
    return this.prisma.bankInfo.findMany({
      where: { accountId: requesterId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Vérifie l'existence ET la propriété avant de retourner le BankInfo.
   * Réutilisée par update/getUsage/remove pour que la vérification ait
   * toujours lieu avant d'agir, jamais après.
   */
  async findOne(id: number, requesterId: number) {
    const bankInfo = await this.prisma.bankInfo.findUnique({ where: { id } });

    if (!bankInfo) {
      throw new NotFoundException(`BankInfo ${id} introuvable`);
    }
    if (bankInfo.accountId !== requesterId) {
      throw new ForbiddenException(
        "Ce moyen de paiement n'appartient pas à ce compte.",
      );
    }

    return bankInfo;
  }

  async update(
    id: number,
    updateBankInfoDto: UpdateBankInfoDto,
    requesterId: number,
  ) {
    // findOne lève NotFoundException/ForbiddenException avant toute écriture
    await this.findOne(id, requesterId);

    return this.prisma.bankInfo.update({
      where: { id },
      data: updateBankInfoDto,
    });
  }

  /**
   * Liste les abonnements qui utilisent encore ce BankInfo — le front s'en
   * sert pour savoir s'il doit proposer un remplacement avant suppression.
   */
  async getUsage(id: number, requesterId: number) {
    await this.findOne(id, requesterId);

    return this.prisma.subscription.findMany({
      where: { bankInfoId: id },
      select: { id: true, reference: true, subscriptionType: true },
    });
  }

  /**
   * Supprime un BankInfo, après vérification de propriété. Si des
   * abonnements y sont encore liés, la suppression est refusée tant qu'un
   * replacementBankInfoId valide (appartenant au même compte) n'est pas
   * fourni — le front propose déjà ce choix, mais le serveur reste le
   * garde-fou final sur cette contrainte d'intégrité.
   */
  async remove(
    id: number,
    requesterId: number,
    replacementBankInfoId?: number,
  ) {
    await this.findOne(id, requesterId);

    const linkedSubscriptions = await this.prisma.subscription.findMany({
      where: { bankInfoId: id },
      select: { id: true },
    });

    if (linkedSubscriptions.length === 0) {
      await this.prisma.bankInfo.delete({ where: { id } });
      return { deleted: true, reassignedCount: 0 };
    }

    if (!replacementBankInfoId) {
      throw new BadRequestException(
        'Cet IBAN est utilisé par au moins un abonnement. Choisissez un IBAN de remplacement.',
      );
    }

    // Le remplacement doit lui aussi appartenir au demandeur — réutilise
    // findOne pour la même garantie de propriété.
    await this.findOne(replacementBankInfoId, requesterId);

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { bankInfoId: id },
        data: { bankInfoId: replacementBankInfoId },
      });
      await tx.bankInfo.delete({ where: { id } });
    });

    return { deleted: true, reassignedCount: linkedSubscriptions.length };
  }
}
