import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'jean.dupont@example.com' })
  email: string;

  @ApiProperty({ example: 'motdepasse123' })
  password: string;

  @ApiProperty({ example: 'Jean', required: false })
  firstName?: string;

  @ApiProperty({ example: 'Dupont', required: false })
  lastName?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'jean.dupont@example.com' })
  email: string;

  @ApiProperty({ example: 'motdepasse123' })
  password: string;
}
