import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { PasswordHasherService } from '../../infrastructure/security/password-hasher.service';
import { ConflictError, NotFoundError, ValidationError } from '../../common/domain/domain-error';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, MockDatabaseService, PasswordHasherService],
    }).compile();
    service = module.get(UsersService);
    const db = module.get(MockDatabaseService);
    await db.reset();
  });

  describe('findMany', () => {
    it('returns paginated users without passwords', async () => {
      const result = await service.findMany({ page: 1, limit: 10 });
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every((u) => !u.hasOwnProperty('password'))).toBe(true);
    });

    it('searches by name', async () => {
      const result = await service.findMany({ page: 1, limit: 100, search: 'admin' });
      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('returns user by id', async () => {
      const user = await service.findOne('u-admin-1');
      expect(user.email).toBe('admin@crm.com');
    });

    it('throws NotFoundError for unknown id', async () => {
      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('creates a new user', async () => {
      const user = await service.create({
        firstname: 'New',
        lastname: 'User',
        email: 'new@test.com',
        phone: '123',
        password: 'pass123',
        role: 'COMMERCIAL',
      } as any);
      expect(user.id).toBeDefined();
      expect(user.email).toBe('new@test.com');
    });

    it('throws ConflictError when email already exists', async () => {
      await expect(service.create({
        firstname: 'Dup',
        lastname: 'User',
        email: 'admin@crm.com',
        password: 'pass',
      } as any)).rejects.toThrow(ConflictError);
    });
  });

  describe('update', () => {
    it('updates user fields', async () => {
      const updated = await service.update('u-admin-1', { firstname: 'Updated' } as any);
      expect(updated.firstname).toBe('Updated');
    });

    it('throws ConflictError when updating to existing email', async () => {
      await expect(service.update('u-comm-1', { email: 'admin@crm.com' } as any))
        .rejects.toThrow(ConflictError);
    });

    it('hashes password on update', async () => {
      const updated = await service.update('u-admin-1', { password: 'newpass' } as any);
      expect(updated).not.toHaveProperty('password');
    });
  });

  describe('remove', () => {
    it('deletes a user', async () => {
      await service.remove('u-comm-3', 'u-admin-1');
      await expect(service.findOne('u-comm-3')).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when trying to delete self', async () => {
      await expect(service.remove('u-admin-1', 'u-admin-1')).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError for unknown id', async () => {
      await expect(service.remove('unknown', 'u-admin-1')).rejects.toThrow(NotFoundError);
    });
  });
});