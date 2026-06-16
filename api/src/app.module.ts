import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BillingModule } from './billing/billing.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
