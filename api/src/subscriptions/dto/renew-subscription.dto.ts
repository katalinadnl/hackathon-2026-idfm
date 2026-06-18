import { IsDateString } from 'class-validator';

export class RenewSubscriptionDto {
  @IsDateString()
  startDate: string;
}