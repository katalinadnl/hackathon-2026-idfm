import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { FranceConnectService } from './france-connect.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetMe } from './decorators/get-me.decorator';
import type { JwtPayload } from './types';

const APP_REDIRECT_URL = process.env.APP_REDIRECT_URL ?? 'application://auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly fc: FranceConnectService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  logout() {
    // Stateless JWT: the client discards the token. Endpoint kept for symmetry.
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@GetMe() user: JwtPayload) {
    const userId = user.id;
    return this.auth.me(userId);
  }

  // ─── France Connect (OIDC) ──────────────────────────────────────────────

  @Get('france-connect/login')
  fcLogin(@Query('redirect') redirect: string, @Res() res: Response) {
    return res.redirect(this.fc.buildAuthorizeUrl(redirect));
  }

  @Get('france-connect/callback')
  async fcCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const appRedirect = state ? this.fc.consumeState(state) : null;
    const target = appRedirect ?? APP_REDIRECT_URL;

    if (error) {
      return res.redirect(`${target}?error=${encodeURIComponent(error)}`);
    }
    if (!code || !appRedirect) {
      throw new BadRequestException('Réponse France Connect invalide.');
    }

    const { accessToken } = await this.fc.exchangeCode(code);
    const identity = await this.fc.fetchUserInfo(accessToken);
    const { token } = await this.auth.loginWithFranceConnect(identity);

    const sep = target.includes('?') ? '&' : '?';
    return res.redirect(`${target}${sep}token=${encodeURIComponent(token)}`);
  }
}
