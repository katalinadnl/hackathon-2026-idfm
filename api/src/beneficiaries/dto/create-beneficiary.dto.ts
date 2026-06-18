import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

import { BeneficiaryStatus } from 'src/generated/prisma/enums';

export class CreateBeneficiaryDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsDateString()
  birthDate: string;

  @IsOptional()
  @IsString()
  socialSecurityNumber?: string;

  @IsEnum(BeneficiaryStatus)
  status: BeneficiaryStatus;

  @IsInt()
  residenceDepartmentId: number;

  @IsOptional()
  @IsInt()
  workStudyDepartmentId?: number;

  @IsOptional()
  @IsBoolean()
  linkToMe?: boolean;
}
