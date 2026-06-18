import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from 'src/auth/types';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recherche des comptes par email (correspondance partielle, insensible
   * à la casse), différent de l'user connecté
   * Limité à 10 résultats pour rester léger en autocomplete.
   */
  async searchAccountsByEmail(query: string, user: JwtPayload) {
    if (query.trim().length < 2) return [];
    const accounts = await this.prisma.account.findMany({
      where: {
        email: { contains: query.trim(), mode: 'insensitive', not: user.email },
      },
      include: { beneficiary: true },
      take: 10,
    });

    return accounts.map((a) => ({
      id: a.id,
      email: a.email,
      accountNumber: a.accountNumber,
      beneficiary: a.beneficiary
        ? {
            firstName: a.beneficiary.firstName,
            lastName: a.beneficiary.lastName,
          }
        : null,
    }));
  }
}
