import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard, RequestUser } from './jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({ secret: 'test-secret' });
    guard = new JwtAuthGuard(jwtService);
  });

  const mockContext = (headers: Record<string, string>): ExecutionContext => {
    const request = { headers } as any;
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
  };

  it('throws UnauthorizedException when no authorization header', () => {
    expect(() => guard.canActivate(mockContext({}))).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when malformed header', () => {
    expect(() => guard.canActivate(mockContext({ authorization: 'Basic abc' })))
      .toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when token is invalid', () => {
    expect(() => guard.canActivate(mockContext({ authorization: 'Bearer invalid-token' })))
      .toThrow(UnauthorizedException);
  });

  it('returns true and sets user on request when token is valid', () => {
    const token = jwtService.sign({ sub: 'u-1', role: 'ADMIN' });
    const ctx = mockContext({ authorization: `Bearer ${token}` });
    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
    const request = ctx.switchToHttp().getRequest();
    expect(request.user).toEqual({ id: 'u-1', role: 'ADMIN' });
  });
});