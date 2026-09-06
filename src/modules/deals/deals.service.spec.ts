import { Test } from '@nestjs/testing';
import { DealsService } from './deals.service';
import { CustomersService } from '../customers/customers.service';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { ActivityLoggerService } from '../../common/services/activity-logger.service';
import { NotFoundError, UnauthorizedError } from '../../common/domain/domain-error';

const admin = { id: 'u-admin-1', role: 'ADMIN' };
const commercial = { id: 'u-comm-1', role: 'COMMERCIAL' };
const commercial2 = { id: 'u-comm-2', role: 'COMMERCIAL' };

describe('DealsService', () => {
  let service: DealsService;
  let customers: CustomersService;
  let db: MockDatabaseService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DealsService, CustomersService, MockDatabaseService, ActivityLoggerService],
    }).compile();
    service = module.get(DealsService);
    customers = module.get(CustomersService);
    db = module.get(MockDatabaseService);
    await db.reset();
  });

  const createCustomer = async (ownerId: string) => {
    return customers.create({ id: ownerId, role: 'ADMIN' } as any, {
      firstname: 'Test',
      lastname: 'Customer',
    } as any);
  };

  const createDeal = async (ownerId: string, customerId?: string) => {
    const cid = customerId || (await createCustomer(ownerId)).id;
    return service.create({ id: ownerId, role: 'ADMIN' } as any, {
      title: 'Test Deal',
      customerId: cid,
      amount: 5000,
      stage: 'PROSPECT',
    } as any);
  };

  describe('findMany', () => {
    it('returns paginated deals', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 10 });
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('filters by stage', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 100, filters: { stage: 'WON' } });
      expect(result.items.every((d) => d.stage === 'WON')).toBe(true);
    });

    it('filters by ownerId for commercial', async () => {
      const result = await service.findMany(commercial, { page: 1, limit: 100 });
      expect(result.items.every((d) => d.ownerId === commercial.id)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('returns deal by id', async () => {
      const deal = await createDeal('u-comm-1');
      const found = await service.findOne(admin, deal.id);
      expect(found.id).toBe(deal.id);
    });

    it('throws NotFoundError for unknown id', async () => {
      await expect(service.findOne(admin, 'unknown')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('creates a deal linked to a customer', async () => {
      const customer = await createCustomer('u-comm-1');
      const deal = await createDeal('u-comm-1', customer.id);
      expect(deal.id).toBeDefined();
      expect(deal.customerId).toBe(customer.id);
    });

    it('throws NotFoundError when customer does not exist', async () => {
      await expect(service.create(admin, {
        title: 'Deal',
        customerId: 'unknown',
        amount: 1000,
      } as any)).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('updates deal stage', async () => {
      const deal = await createDeal('u-comm-1');
      const updated = await service.update(admin, deal.id, { stage: 'WON' } as any);
      expect(updated.stage).toBe('WON');
    });

    it('throws UnauthorizedError when commercial updates other owner', async () => {
      const deal = await createDeal('u-comm-2');
      await expect(service.update(commercial, deal.id, { stage: 'WON' } as any))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('remove', () => {
    it('deletes a deal', async () => {
      const deal = await createDeal('u-comm-1');
      await service.remove(admin, deal.id);
      await expect(service.findOne(admin, deal.id)).rejects.toThrow(NotFoundError);
    });
  });
});