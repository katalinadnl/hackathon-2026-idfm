import { PartialType } from '@nestjs/swagger';
import { OmitType } from '@nestjs/swagger';
import { CreateBankInfoDto } from './create-bank-info.dto';

export class UpdateBankInfoDto extends PartialType(
  OmitType(CreateBankInfoDto, ['accountId'] as const),
) {}
