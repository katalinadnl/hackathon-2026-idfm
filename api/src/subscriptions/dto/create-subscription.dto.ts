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

  @IsString()
  navigoNumber: string;

  @IsString()
  subscriptionType: string;

  @IsOptional()
  @IsInt()
  transportProductId?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  bankInfoId: number;
}
