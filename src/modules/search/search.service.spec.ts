import { Test } from '@nestjs/testing';
import { SearchService } from './search.service';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';

const admin = { id: 'u-admin-1', role: 'ADMIN' };
const commercial = { id: 'u-comm-1', role: 'COMMERCIAL' };

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SearchService, MockDatabaseService],
    }).compile();
    service = module.get(SearchService);
    const db = module.get(MockDatabaseService);
    await db.reset();
  });

  it('returns empty for query shorter than 2 chars', () => {
    expect(service.search(admin, 'a')).toHaveLength(0);
    expect(service.search(admin, '')).toHaveLength(0);
  });

  it('finds customers by name', () => {
    const results = service.search(admin, 'martin');
    const customers = results.filter((r) => r.type === 'CUSTOMER');
    expect(customers.length).toBeGreaterThan(0);
  });

  it('finds leads', () => {
    const results = service.search(admin, 'prospect');
    expect(results.some((r) => r.type === 'LEAD')).toBe(true);
  });

  it('finds deals by title', () => {
    const results = service.search(admin, 'contrat');
    expect(results.some((r) => r.type === 'DEAL')).toBe(true);
  });

  it('returns results with url and label', () => {
    const results = service.search(admin, 'martin');
    results.forEach((r) => {
      expect(r).toHaveProperty('url');
      expect(r).toHaveProperty('label');
      expect(r).toHaveProperty('subtitle');
      expect(r).toHaveProperty('type');
    });
  });

  it('restricts results to own data for commercial', () => {
    const results = service.search(commercial, 'a');
    const customerIds = results.filter((r) => r.type === 'CUSTOMER').map((r) => r.id);
    const dbCustomers = service['db'].customers.filter((c) => customerIds.includes(c.id));
    expect(dbCustomers.every((c) => c.ownerId === commercial.id)).toBe(true);
  });

  it('limits results per type to 5', () => {
    const results = service.search(admin, 'a');
    const types = ['CUSTOMER', 'LEAD', 'DEAL', 'TASK'];
    types.forEach((type) => {
      const count = results.filter((r) => r.type === type).length;
      expect(count).toBeLessThanOrEqual(5);
    });
  });
});