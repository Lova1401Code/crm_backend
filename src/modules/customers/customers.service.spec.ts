import { Test } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { NotFoundError, UnauthorizedError } from '../../common/domain/domain-error';

const admin = { id: 'u-admin-1', role: 'ADMIN' };
const commercial = { id: 'u-comm-1', role: 'COMMERCIAL' };
const commercial2 = { id: 'u-comm-2', role: 'COMMERCIAL' };

describe('CustomersService', () => {
  let service: CustomersService;
  let db: MockDatabaseService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CustomersService, MockDatabaseService],
    }).compile();
    service = module.get(CustomersService);
    db = module.get(MockDatabaseService);
    await db.reset();
  });

  const createCustomer = async (ownerId: string, name = 'Test') => {
    return service.create({ id: ownerId, role: 'ADMIN' } as any, {
      firstname: name,
      lastname: 'Customer',
      company: 'TestCo',
      email: 'test@test.com',
    } as any);
  };

  describe('findMany', () => {
    it('returns paginated customers', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 10 });
      expect(result.items.length).toBeLessThanOrEqual(10);
      expect(result.total).toBeGreaterThanOrEqual(result.items.length);
    });

    it('filters by ownerId for commercial', async () => {
      const result = await service.findMany(commercial, { page: 1, limit: 100 });
      expect(result.items.every((c) => c.ownerId === commercial.id)).toBe(true);
    });

    it('filters by tag', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 100, filters: { tags: 'VIP' } });
      expect(result.items.every((c) => c.tags.includes('VIP'))).toBe(true);
    });

    it('searches by name', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 100, search: 'martin' });
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('sorts by firstname ascending', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 100, sortBy: 'firstname', sortOrder: 'asc' });
      expect(result.items.length).toBeGreaterThan(0);
      const first = result.items[0].firstname;
      const last = result.items[result.items.length - 1].firstname;
      expect(first.trim().localeCompare(last.trim())).toBeLessThanOrEqual(0);
    });
  });

  describe('findOne', () => {
    it('returns customer by id', async () => {
      const customer = await createCustomer('u-comm-1');
      const found = await service.findOne(admin, customer.id);
      expect(found.id).toBe(customer.id);
    });

    it('throws NotFoundError for unknown id', async () => {
      await expect(service.findOne(admin, 'unknown')).rejects.toThrow(NotFoundError);
    });

    it('throws UnauthorizedError when commercial accesses other owner', async () => {
      const customer = await createCustomer('u-comm-2');
      await expect(service.findOne(commercial, customer.id)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('create', () => {
    it('creates a customer', async () => {
      const customer = await service.create(admin, {
        firstname: 'John',
        lastname: 'Doe',
        company: 'Acme',
        email: 'john@acme.com',
        tags: ['VIP'],
      } as any);
      expect(customer.id).toBeDefined();
      expect(customer.firstname).toBe('John');
      expect(customer.tags).toEqual(['VIP']);
    });

    it('forces ownerId to commercial id', async () => {
      const customer = await service.create(commercial, {
        firstname: 'John',
        lastname: 'Doe',
      } as any);
      expect(customer.ownerId).toBe(commercial.id);
    });
  });

  describe('update', () => {
    it('updates customer fields', async () => {
      const customer = await createCustomer('u-comm-1');
      const updated = await service.update(admin, customer.id, { firstname: 'Updated' } as any);
      expect(updated.firstname).toBe('Updated');
    });

    it('updates tags', async () => {
      const customer = await createCustomer('u-comm-1');
      const updated = await service.update(admin, customer.id, { tags: ['New'] } as any);
      expect(updated.tags).toEqual(['New']);
    });

    it('throws UnauthorizedError when commercial updates other owner', async () => {
      const customer = await createCustomer('u-comm-2');
      await expect(service.update(commercial, customer.id, { firstname: 'Hacked' } as any))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('remove', () => {
    it('deletes a customer', async () => {
      const customer = await createCustomer('u-comm-1');
      await service.remove(admin, customer.id);
      await expect(service.findOne(admin, customer.id)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError for unknown id', async () => {
      await expect(service.remove(admin, 'unknown')).rejects.toThrow(NotFoundError);
    });
  });
});