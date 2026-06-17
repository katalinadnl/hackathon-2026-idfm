import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountRole } from 'src/generated/prisma/enums';
import { JwtPayload } from '../types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AccountRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;
    const user = context
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>().user;
    if (!user) {
      throw new ForbiddenException();
    }
    return requiredRoles.includes(user.role);
  }
}
