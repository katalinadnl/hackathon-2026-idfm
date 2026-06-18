import { Module } from '@nestjs/common';

import { StatusVerificationsController } from './status-verifications.controller';
import { StatusVerificationsService } from './status-verifications.service';

@Module({
  controllers: [StatusVerificationsController],
  providers: [StatusVerificationsService],
})
export class StatusVerificationsModule {}