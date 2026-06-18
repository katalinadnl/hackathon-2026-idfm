import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto, RegisterDto } from './dto';
import { AccountRole } from 'src/generated/prisma/enums';
import { JwtPayload } from './types';
import { AccountsService } from 'src/accounts/accounts.service';

export type AuthUser = {
  id: number;
  email: string;
  accountNumber: string;
  role: AccountRole;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

const APP_RESET_URL = process.env.APP_RESET_PASSWORD_URL ?? 'http://localhost';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly accountService: AccountsService,
  ) {}

  private generateOtp(): string {
    return String(randomInt(100000, 999999));
  }

  private async toAuthUser(accountId: number): Promise<AuthUser> {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: { beneficiaries: true },
    });
    return {
      id: account.id,
      email: account.email,
      accountNumber: account.accountNumber,
      role: account.role,
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
        accountNumber: await this.accountService.generateAccountNumber(),
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

    const code = this.generateOtp();
    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        twoFactorCode: code,
        twoFactorExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.mail.sendOtp(email, code);

    return {
      requires2FA: true,
      message: 'Code de vérification envoyé par email.',
    };
  }

  async verifyOtp(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const account = await this.prisma.account.findUnique({
      where: { email: normalizedEmail },
    });

    if (
      !account ||
      !account.twoFactorCode ||
      !account.twoFactorExpiresAt ||
      account.twoFactorCode !== code ||
      account.twoFactorExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Code invalide ou expiré.');
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: { twoFactorCode: null, twoFactorExpiresAt: null },
    });

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
      const passwordHash = await bcrypt.hash(
        randomBytes(16).toString('hex'),
        10,
      );
      account = await this.prisma.account.create({
        data: {
          email,
          passwordHash,
          accountNumber: await this.accountService.generateAccountNumber(),
        },
      });
    }

    const user = await this.toAuthUser(account.id);
    return { token: this.sign(user), user };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const account = await this.prisma.account.findUnique({
      where: { email: normalizedEmail },
    });

    // Toujours retourner success pour ne pas révéler si l'email existe
    if (!account) {
      return { message: 'Si ce compte existe, un email a été envoyé.' };
    }

    const token = randomBytes(32).toString('hex');
    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    const resetUrl = `${APP_RESET_URL}?reset-token=${token}`;
    await this.mail.sendPasswordReset(normalizedEmail, resetUrl);

    return { message: 'Si ce compte existe, un email a été envoyé.' };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException(
        'Le mot de passe doit faire au moins 6 caractères.',
      );
    }

    const account = await this.prisma.account.findUnique({
      where: { resetPasswordToken: token },
    });

    if (
      !account ||
      !account.resetPasswordExpiresAt ||
      account.resetPasswordExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Lien de réinitialisation invalide ou expiré.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });

    return { message: 'Mot de passe réinitialisé avec succès.' };
  }

  async me(userId: number): Promise<AuthUser> {
    return this.toAuthUser(userId);
  }
}
