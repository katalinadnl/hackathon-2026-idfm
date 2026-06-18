import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum ReportReason {
  LOST = 'lost',
  STOLEN = 'stolen',
  DAMAGED = 'damaged',
}

export class NewAddressDto {
  @IsString()
  line1!: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  city!: string;

  @IsString()
  postalCode!: string;
}

export class ReportLostOrStolenDto {
  @IsEnum(ReportReason)
  reason!: ReportReason;

  // Cas 1 : utiliser une adresse existante du bénéficiaire
  @IsOptional()
  @IsInt()
  addressId?: number;

  // Cas 2 : créer une nouvelle adresse (type "delivery") et l'utiliser
  // pour cette livraison. Mutuellement exclusif avec addressId — si les
  // deux sont fournis, addressId est prioritaire (voir service).
  @IsOptional()
  @ValidateNested()
  @Type(() => NewAddressDto)
  newAddress?: NewAddressDto;
}
