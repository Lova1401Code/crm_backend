import { Test } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { LeadScoringService } from './lead-scoring.service';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { ActivityLoggerService } from '../../common/services/activity-logger.service';
import { NotFoundError, UnauthorizedError, ConflictError } from '../../common/domain/domain-error';

const admin = { id: 'u-admin-1', role: 'ADMIN' };
const commercial = { id: 'u-comm-1', role: 'COMMERCIAL' };
const commercial2 = { id: 'u-comm-2', role: 'COMMERCIAL' };

describe('LeadsService', () => {
  let service: LeadsService;
  let db: MockDatabaseService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LeadsService, LeadScoringService, MockDatabaseService, ActivityLoggerService],
    }).compile();
    service = module.get(LeadsService);
    db = module.get(MockDatabaseService);
    await db.reset();
  });

  const createLead = async (ownerId: string) => {
    return service.create({ id: ownerId, role: 'ADMIN' } as any, {
      firstname: 'Test',
      lastname: 'Lead',
      company: 'TestCo',
      source: 'Site web',
      tags: [],
    } as any);
  };

  describe('findMany', () => {
    it('returns leads with score', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 5 });
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]).toHaveProperty('score');
    });

    it('filters by status', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 100, filters: { status: 'NEW' } });
      expect(result.items.every((l) => l.status === 'NEW')).toBe(true);
    });

    it('filters by source', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 100, filters: { source: 'Site web' } });
      expect(result.items.every((l) => l.source === 'Site web')).toBe(true);
    });

    it('filters by tag', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 100, filters: { tags: 'Hot' } });
      expect(result.items.every((l) => l.tags.includes('Hot'))).toBe(true);
    });

    it('sorts by score', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 100, sortBy: 'score', sortOrder: 'desc' });
      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i].score <= result.items[i - 1].score).toBe(true);
      }
    });
  });

  describe('findOne', () => {
    it('returns lead with score', async () => {
      const lead = await createLead('u-comm-1');
      const found = await service.findOne(admin, lead.id);
      expect(found.id).toBe(lead.id);
      expect(found).toHaveProperty('score');
    });

    it('throws NotFoundError for unknown id', async () => {
      await expect(service.findOne(admin, 'unknown')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('creates a lead with tags', async () => {
      const lead = await service.create(admin, {
        firstname: 'John',
        lastname: 'Prospect',
        source: 'Recommandation',
        tags: ['Hot', 'Stratégique'],
      } as any);
      expect(lead.id).toBeDefined();
      expect(lead.tags).toEqual(['Hot', 'Stratégique']);
    });
  });

  describe('update', () => {
    it('updates lead tags', async () => {
      const lead = await createLead('u-comm-1');
      const updated = await service.update(admin, lead.id, { tags: ['VIP'] } as any);
      expect(updated.tags).toEqual(['VIP']);
    });

    it('throws UnauthorizedError when commercial updates other owner', async () => {
      const lead = await createLead('u-comm-2');
      await expect(service.update(commercial, lead.id, { firstname: 'Hacked' } as any))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('convert', () => {
    it('converts lead to customer', async () => {
      const lead = await createLead('u-comm-1');
      const result = await service.convert(admin, lead.id);
      expect(result.customer).toBeDefined();
      expect(result.customer.firstname).toBe(lead.firstname);

      const updated = await service.findOne(admin, lead.id);
      expect(updated.status).toBe('CONVERTED');
    });

    it('throws ConflictError when converting already converted lead', async () => {
      const lead = await createLead('u-comm-1');
      await service.convert(admin, lead.id);
      await expect(service.convert(admin, lead.id)).rejects.toThrow(ConflictError);
    });

    it('throws NotFoundError for unknown lead', async () => {
      await expect(service.convert(admin, 'unknown')).rejects.toThrow(NotFoundError);
    });
  });

  describe('LeadScoringService', () => {
    it('gives higher score for recommandation source', async () => {
      const lead1 = await service.create(admin, { firstname: 'A', lastname: 'B', source: 'Recommandation' } as any);
      const lead2 = await service.create(admin, { firstname: 'C', lastname: 'D', source: 'Réseaux sociaux' } as any);
      const score1 = await service.findOne(admin, lead1.id);
      const score2 = await service.findOne(admin, lead2.id);
      expect(score1.score).toBeGreaterThan(score2.score);
    });

    it('gives bonus for Hot tag', async () => {
      const lead1 = await service.create(admin, { firstname: 'A', lastname: 'B', source: 'Site web', tags: ['Hot'] } as any);
      const lead2 = await service.create(admin, { firstname: 'C', lastname: 'D', source: 'Site web', tags: [] } as any);
      const score1 = await service.findOne(admin, lead1.id);
      const score2 = await service.findOne(admin, lead2.id);
      expect(score1.score).toBeGreaterThan(score2.score);
    });

    it('score is between 0 and 100', async () => {
      const lead = await service.create(admin, { firstname: 'A', lastname: 'B', source: 'Site web' } as any);
      const found = await service.findOne(admin, lead.id);
      expect(found.score).toBeGreaterThanOrEqual(0);
      expect(found.score).toBeLessThanOrEqual(100);
    });
  });
});