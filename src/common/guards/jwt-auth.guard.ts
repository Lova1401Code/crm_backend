import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface RequestUser {
  id: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const header = req.headers['authorization'] || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new UnauthorizedException('Token manquant');

    try {
      const payload = this.jwt.verify(match[1]);
      req.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}