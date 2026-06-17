import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types';

export const GetMe = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();
    return request.user;
  },
);
