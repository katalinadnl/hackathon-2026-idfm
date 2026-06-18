import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  BeneficiaryStatus,
  VerificationSource,
} from 'src/generated/prisma/enums';

export class CreateStatusVerificationDto {
  @IsInt()
  beneficiaryId: number;

  @IsEnum(BeneficiaryStatus)
  status: BeneficiaryStatus;

  @IsEnum(VerificationSource)
  source: VerificationSource;

  @IsOptional()
  @IsInt()
  tariffReductionId?: number;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}
