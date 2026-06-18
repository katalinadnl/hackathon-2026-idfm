import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BillingModule } from './billing/billing.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TransportModule } from './transport/transport.module';
import { AuthModule } from './auth/auth.module';
import { DepartmentsModule } from './departments/departments.module';
import { TariffsModule } from './tariffs/tariffs.module';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { AccountsModule } from './accounts/accounts.module';
import { BankInfoModule } from './bank-info/bank-info.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BeneficiariesModule,
    SubscriptionsModule,
    TransportModule,
    BillingModule,
    DepartmentsModule,
    TariffsModule,
    AccountsModule,
    BankInfoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
