import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { enforceOwnership } from '../../common/rbac/rbac';
import { RequestUser } from '../../common/guards/jwt-auth.guard';

export interface SearchResult {
  id: string;
  type: 'CUSTOMER' | 'LEAD' | 'DEAL' | 'TASK';
  label: string;
  subtitle: string;
  url: string;
}

@Injectable()
export class SearchService {
  constructor(private readonly db: MockDatabaseService) {}

  search(user: RequestUser, query: string): SearchResult[] {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase();

    const customers = this.db.customers
      .filter((c) => {
        if (user.role !== 'ADMIN' && c.ownerId !== user.id) return false;
        return (
          c.firstname.toLowerCase().includes(q) ||
          c.lastname.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        );
      })
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        type: 'CUSTOMER' as const,
        label: `${c.firstname} ${c.lastname}`,
        subtitle: c.company || c.email || 'Client',
        url: `/customers/${c.id}`,
      }));

    const leads = this.db.leads
      .filter((l) => {
        if (user.role !== 'ADMIN' && l.ownerId !== user.id) return false;
        return (
          l.firstname.toLowerCase().includes(q) ||
          l.lastname.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q)
        );
      })
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        type: 'LEAD' as const,
        label: `${l.firstname} ${l.lastname}`,
        subtitle: l.company || l.source || 'Prospect',
        url: `/leads/${l.id}`,
      }));

    const deals = this.db.deals
      .filter((d) => {
        if (user.role !== 'ADMIN' && d.ownerId !== user.id) return false;
        return d.title.toLowerCase().includes(q);
      })
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        type: 'DEAL' as const,
        label: d.title,
        subtitle: `${d.amount} € • ${d.stage}`,
        url: `/deals`,
      }));

    const tasks = this.db.tasks
      .filter((t) => {
        if (user.role !== 'ADMIN' && t.ownerId !== user.id) return false;
        return t.title.toLowerCase().includes(q);
      })
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        type: 'TASK' as const,
        label: t.title,
        subtitle: t.dueDate || 'Tâche',
        url: `/tasks`,
      }));

    return [...customers, ...leads, ...deals, ...tasks];
  }
}