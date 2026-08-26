import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestUser } from './jwt-auth.guard';
import { Request } from 'express';
import { UnauthorizedError } from '../domain/domain-error';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', ctx.getHandler());
    if (!roles || roles.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    if (!req.user) throw new UnauthorizedError('Non authentifié', true);
    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedError('Accès refusé : rôle insuffisant', true);
    }
    return true;
  }
}