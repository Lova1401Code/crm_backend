import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DashboardService, MockDatabaseService],
    }).compile();
    service = module.get(DashboardService);
    const db = module.get(MockDatabaseService);
    await db.reset();
  });

  describe('getStats', () => {
    it('returns counts for all entities', () => {
      const stats = service.getStats();
      expect(stats).toHaveProperty('customersCount');
      expect(stats).toHaveProperty('leadsCount');
      expect(stats).toHaveProperty('usersCount');
      expect(stats).toHaveProperty('convertedLeadsCount');
      expect(stats.customersCount).toBeGreaterThan(0);
      expect(stats.leadsCount).toBeGreaterThan(0);
    });
  });

  describe('getEvolution', () => {
    it('returns 12 months of data', () => {
      const evo = service.getEvolution();
      expect(evo.evolution).toHaveLength(12);
      evo.evolution.forEach((m) => {
        expect(m).toHaveProperty('month');
        expect(m).toHaveProperty('label');
        expect(m).toHaveProperty('leads');
        expect(m).toHaveProperty('customers');
      });
    });

    it('returns leads by status', () => {
      const evo = service.getEvolution();
      expect(evo.leadsByStatus.length).toBeGreaterThan(0);
      evo.leadsByStatus.forEach((s) => {
        expect(s).toHaveProperty('status');
        expect(s).toHaveProperty('count');
      });
    });

    it('returns leads by source', () => {
      const evo = service.getEvolution();
      expect(evo.leadsBySource.length).toBeGreaterThan(0);
    });
  });

  describe('getPipeline', () => {
    it('returns pipeline stats', () => {
      const pipe = service.getPipeline();
      expect(pipe).toHaveProperty('wonRevenue');
      expect(pipe).toHaveProperty('forecast');
      expect(pipe).toHaveProperty('openDeals');
      expect(pipe).toHaveProperty('dealsByStage');
      expect(pipe.dealsByStage).toHaveLength(6);
    });

    it('calculates forecast from open deals', () => {
      const pipe = service.getPipeline();
      expect(pipe.forecast).toBeGreaterThanOrEqual(0);
    });

    it('dealsByStage has all 6 stages', () => {
      const pipe = service.getPipeline();
      const stages = pipe.dealsByStage.map((d) => d.stage);
      expect(stages).toEqual(['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']);
    });
  });
});