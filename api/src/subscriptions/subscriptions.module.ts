import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { MailModule } from 'src/mail/mail.module';
import { AccountsModule } from 'src/accounts/accounts.module';
import { AccountSubscriptionsController } from './account-subscriptions.controller';

@Module({
  controllers: [AccountSubscriptionsController, SubscriptionsController],
  imports: [MailModule, AccountsModule],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
