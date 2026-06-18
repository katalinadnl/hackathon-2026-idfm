import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from 'src/auth/types';
import { randomBytes } from 'node:crypto';
import { Account } from 'src/generated/prisma/client';
import { hash } from 'bcrypt';

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

  /**
   * Crée un compte avec un mot de passe temporaire généré aléatoirement.
   * mustChangePassword est forcé à true : l'utilisateur devra le changer
   * dès sa première connexion. Renvoie le compte créé ET le mot de passe en
   * clair (jamais stocké ni renvoyé par ailleurs), pour que l'appelant
   * puisse l'envoyer par email — c'est la seule fois où ce mot de passe
   * existe sous forme lisible.
   */
  async createWithTemporaryPassword(
    email: string,
    beneficiaryId?: number,
  ): Promise<{ account: Account; temporaryPassword: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.prisma.account.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await hash(temporaryPassword, 10);

    const account = await this.prisma.account.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        accountNumber: await this.generateAccountNumber(),
        beneficiaryId: beneficiaryId ?? null,
        mustChangePassword: true,
      },
    });

    return { account, temporaryPassword };
  }

  private generateTemporaryPassword(): string {
    return randomBytes(6).toString('hex');
  }

  async generateAccountNumber(): Promise<string> {
    const count = await this.prisma.account.count();
    return `ACC-${String(count + 1).padStart(6, '0')}`;
  }
}
