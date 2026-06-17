import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsInt()
  beneficiaryId: number;

  @IsOptional()
  @IsInt()
  referrerId?: number;

  @IsOptional()
  @IsInt()
  payerId?: number;

  @IsString()
  navigoNumber: string;

  @IsString()
  subscriptionType: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
