import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';

const DEAL_STAGE_PROBABILITY: Record<string, number> = {
  PROSPECT: 10, QUALIFIED: 25, PROPOSAL: 50, NEGOTIATION: 75, WON: 100, LOST: 0,
};

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

@Injectable()
export class DashboardService {
  constructor(private readonly db: MockDatabaseService) {}

  getStats() {
    return {
      customersCount: this.db.customers.length,
      leadsCount: this.db.leads.length,
      usersCount: this.db.users.length,
      convertedLeadsCount: this.db.leads.filter((l) => l.status === 'CONVERTED').length,
    };
  }

  getEvolution() {
    const now = new Date();
    const months: { month: string; label: string; leads: number; customers: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = MONTH_LABELS[d.getMonth()];
      const leads = this.db.leads.filter((l) => l.createdAt.startsWith(key)).length;
      const customers = this.db.customers.filter((c) => c.createdAt.startsWith(key)).length;
      months.push({ month: key, label, leads, customers });
    }

    const statusMap = new Map<string, number>();
    for (const l of this.db.leads) {
      statusMap.set(l.status, (statusMap.get(l.status) || 0) + 1);
    }
    const leadsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

    const sourceMap = new Map<string, number>();
    for (const l of this.db.leads) {
      if (l.source) sourceMap.set(l.source, (sourceMap.get(l.source) || 0) + 1);
    }
    const leadsBySource = Array.from(sourceMap.entries()).map(([source, count]) => ({ source, count }));

    return { evolution: months, leadsByStatus, leadsBySource };
  }

  getPipeline() {
    const openDeals = this.db.deals.filter((d) => d.stage !== 'WON' && d.stage !== 'LOST');
    const wonDeals = this.db.deals.filter((d) => d.stage === 'WON');

    const wonRevenue = wonDeals.reduce((s, d) => s + d.amount, 0);
    const forecast = openDeals.reduce((s, d) => s + d.amount * (DEAL_STAGE_PROBABILITY[d.stage] || 0) / 100, 0);

    const stageMap = new Map<string, { count: number; amount: number }>();
    for (const d of this.db.deals) {
      const cur = stageMap.get(d.stage) || { count: 0, amount: 0 };
      cur.count++;
      cur.amount += d.amount;
      stageMap.set(d.stage, cur);
    }
    const stages = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    const dealsByStage = stages.map((stage) => {
      const s = stageMap.get(stage);
      return { stage, count: s?.count || 0, amount: s?.amount || 0 };
    });

    return { wonRevenue, forecast, openDeals: openDeals.length, dealsByStage };
  }
}