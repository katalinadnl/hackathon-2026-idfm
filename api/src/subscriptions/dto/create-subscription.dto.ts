import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMode } from 'src/generated/prisma/enums';

export class CreateSubscriptionDto {
  @IsInt()
  beneficiaryId: number;

  @IsOptional()
  @IsInt()
  referrerId?: number;

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

  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;
}
