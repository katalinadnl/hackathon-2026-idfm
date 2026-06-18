import { IsInt } from 'class-validator';

export class LinkReferrerDto {
  @IsInt()
  referrerId: number;
}
