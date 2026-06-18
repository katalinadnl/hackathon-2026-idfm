import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? 'localhost',
      port: Number(process.env.MAIL_PORT ?? 1025),
      secure: false,
      ignoreTLS: true,
    });
  }

  async sendOtp(to: string, code: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM ?? 'noreply@idfm.fr',
      to,
      subject: 'Votre code de vérification IDFM',
      text: `Votre code de vérification est : ${code}\n\nCe code expire dans 10 minutes.`,
      html: `<p>Votre code de vérification est : <strong>${code}</strong></p><p>Ce code expire dans 10 minutes.</p>`,
    });
    this.logger.log(`OTP sent to ${to}`);
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM ?? 'noreply@idfm.fr',
      to,
      subject: 'Réinitialisation de votre mot de passe IDFM',
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}\n\nCe lien expire dans 1 heure.`,
      html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Ce lien expire dans 1 heure.</p>`,
    });
    this.logger.log(`Password reset email sent to ${to}`);
  }
  async sendAccountCreatedEmail(
    to: string,
    { temporaryPassword }: { temporaryPassword: string },
  ): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM ?? 'noreply@idfm.fr',
      to,
      subject: 'Votre compte IDFM Navigo a été créé',
      text: `Un compte a été créé pour vous sur IDFM Navigo.\n\nIdentifiant : ${to}\nMot de passe temporaire : ${temporaryPassword}\n\nPour des raisons de sécurité, vous devrez changer ce mot de passe dès votre première connexion.`,
      html: `<p>Un compte a été créé pour vous sur IDFM Navigo.</p><p>Identifiant : <strong>${to}</strong><br/>Mot de passe temporaire : <strong>${temporaryPassword}</strong></p><p>Pour des raisons de sécurité, vous devrez changer ce mot de passe dès votre première connexion.</p>`,
    });
    this.logger.log(`Account created email sent to ${to}`);
  }
}
