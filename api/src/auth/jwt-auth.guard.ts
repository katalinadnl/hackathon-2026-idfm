import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const header = req.headers.authorization;
    const queryToken =
      typeof req.query?.token === 'string' ? req.query.token : null;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : queryToken;

    if (!token) {
      throw new UnauthorizedException('Token manquant.');
    }
    try {
      const payload = this.jwt.verify(token);
      (req as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré.');
    }
  }
}
