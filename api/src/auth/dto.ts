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

export class VerifyOtpDto {
  @ApiProperty({ example: 'jean.dupont@example.com' })
  email: string;

  @ApiProperty({ example: '123456' })
  code: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'jean.dupont@example.com' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123token' })
  token: string;

  @ApiProperty({ example: 'nouveauMotDePasse123' })
  newPassword: string;
}
