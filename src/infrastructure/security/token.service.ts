import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface TokenPayload {
  sub: string;
  role: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  encode(payload: TokenPayload): string {
    return this.jwt.sign({ sub: payload.sub, role: payload.role });
  }

  decode(token: string): TokenPayload | null {
    try {
      const p = this.jwt.verify<{ sub: string; role: string }>(token);
      return { sub: p.sub, role: p.role };
    } catch {
      return null;
    }
  }
}