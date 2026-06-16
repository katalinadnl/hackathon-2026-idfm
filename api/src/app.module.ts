import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TransportModule } from './transport/transport.module';

@Module({
  imports: [PrismaModule, SubscriptionsModule, TransportModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
