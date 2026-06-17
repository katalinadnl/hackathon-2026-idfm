import { Module } from '@nestjs/common';
import { BankInfoService } from './bank-info.service';
import { BankInfoController } from './bank-info.controller';

@Module({
  controllers: [BankInfoController],
  providers: [BankInfoService],
})
export class BankInfoModule {}
