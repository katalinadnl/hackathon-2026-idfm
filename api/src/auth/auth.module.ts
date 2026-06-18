import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FranceConnectService } from './france-connect.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MailModule } from '../mail/mail.module';
import { AccountsModule } from 'src/accounts/accounts.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '30d' },
    }),
    MailModule,
    AccountsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, FranceConnectService, JwtAuthGuard],
})
export class AuthModule {}
