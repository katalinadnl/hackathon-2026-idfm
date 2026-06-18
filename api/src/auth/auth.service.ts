import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';
import { AccountRole } from 'src/generated/prisma/enums';
import { JwtPayload } from './types';

export type AuthUser = {
  id: number;
  email: string;
  accountNumber: string;
  beneficiaryId: number | null;
  firstName: string | null;
  lastName: string | null;
  role: AccountRole;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private generateAccountNumber(): string {
    return 'CM' + randomBytes(5).toString('hex').toUpperCase();
  }

  private async toAuthUser(accountId: number): Promise<AuthUser> {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: { beneficiary: true },
    });
    return {
      id: account.id,
      email: account.email,
      accountNumber: account.accountNumber,
      role: account.role,
      beneficiaryId: account.beneficiaryId,
      firstName: account.beneficiary?.firstName ?? null,
      lastName: account.beneficiary?.lastName ?? null,
    };
  }

  private sign(user: AuthUser): string {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwt.sign(payload);
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (!email || !dto.password || dto.password.length < 6) {
      throw new ConflictException(
        'Email et mot de passe (6 caractères min.) requis.',
      );
    }

    const existing = await this.prisma.account.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const account = await this.prisma.account.create({
      data: {
        email,
        passwordHash,
        accountNumber: this.generateAccountNumber(),
      },
    });

    const user = await this.toAuthUser(account.id);
    return { token: this.sign(user), user };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const account = await this.prisma.account.findUnique({ where: { email } });
    if (!account) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }
    const valid = await bcrypt.compare(dto.password, account.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const user = await this.toAuthUser(account.id);
    return { token: this.sign(user), user };
  }

  async loginWithFranceConnect(identity: {
    email: string;
    givenName?: string;
    familyName?: string;
  }) {
    const email = identity.email.trim().toLowerCase();
    let account = await this.prisma.account.findUnique({ where: { email } });

    if (!account) {
      // Placeholder password — France Connect accounts authenticate via OIDC.
      const passwordHash = await bcrypt.hash(
        randomBytes(16).toString('hex'),
        10,
      );
      account = await this.prisma.account.create({
        data: {
          email,
          passwordHash,
          accountNumber: this.generateAccountNumber(),
        },
      });
    }

    const user = await this.toAuthUser(account.id);
    return { token: this.sign(user), user };
  }

  async me(userId: number): Promise<AuthUser> {
    return this.toAuthUser(userId);
  }
}