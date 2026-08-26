import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../guards/jwt-auth.guard';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const req = ctx.switchToHttp().getRequest<Request & { user: RequestUser }>();
    return req.user;
  },
);