import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { PasswordHasherService } from '../../infrastructure/security/password-hasher.service';
import { TokenService } from '../../infrastructure/security/token.service';
import { UnauthorizedError, ValidationError } from '../../common/domain/domain-error';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } }),
      ],
      providers: [AuthService, MockDatabaseService, PasswordHasherService, TokenService],
    }).compile();
    service = module.get(AuthService);
    const db = module.get(MockDatabaseService);
    await db.reset();
  });

  describe('login', () => {
    it('logs in with valid credentials', async () => {
      const result = await service.login('admin@crm.com', 'admin123');
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('admin@crm.com');
      expect(result.user).not.toHaveProperty('password');
    });

    it('throws ValidationError when email or password missing', async () => {
      await expect(service.login('', '')).rejects.toThrow(ValidationError);
    });

    it('throws UnauthorizedError with wrong password', async () => {
      await expect(service.login('admin@crm.com', 'wrongpass')).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError with unknown email', async () => {
      await expect(service.login('unknown@test.com', 'pass')).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when account is disabled', async () => {
      await expect(service.login('david@crm.com', 'david123')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getProfile', () => {
    it('returns public user by id', async () => {
      const profile = await service.getProfile('u-admin-1');
      expect(profile.email).toBe('admin@crm.com');
      expect(profile).not.toHaveProperty('password');
    });

    it('throws NotFoundError for unknown id', async () => {
      await expect(service.getProfile('unknown')).rejects.toThrow();
    });
  });
});