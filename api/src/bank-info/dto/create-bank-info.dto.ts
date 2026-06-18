import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateBankInfoDto {
  @ApiProperty({ description: 'Compte propriétaire de cet IBAN' })
  @IsInt()
  accountId: number;

  @ApiProperty({ example: 'FR7630001007941234567890185' })
  @IsString()
  @MinLength(15)
  iban: string;

  @ApiPropertyOptional({ example: 'BDFEFRPPXXX' })
  @IsOptional()
  @IsString()
  bic?: string;

  @ApiProperty({ example: 'Alice Martin' })
  @IsString()
  holderName: string;

  @ApiPropertyOptional({ example: 'Mon compte' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
