import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { NotFoundError, UnauthorizedError } from '../../common/domain/domain-error';
import {
  matchSearch, paginate, uid, nowIso,
} from '../../common/utils/repo-utils';
import { enforceOwnership, mergeFilters, forcedOwnerId } from '../../common/rbac/rbac';
import { CreateActivityDto } from './dto/activity.dto';
import { ActivityRecord, RelatedEntityType } from '../../infrastructure/mock/seed';
import { RequestUser } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class ActivitiesService {
  constructor(private readonly db: MockDatabaseService) {}

  async findMany(user: RequestUser, opts: { page?: number; limit?: number; search?: string; filters?: Record<string, unknown> }) {
    let items = [...this.db.activities].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    items = matchSearch(items, opts.search || '', ['subject', 'description'] as (keyof ActivityRecord)[]);
    const filters = mergeFilters(user, opts.filters);
    items = items.filter((a) => !filters || Object.entries(filters).every(([k, v]) => v === undefined || v === null || v === '' || a[k as keyof ActivityRecord] === v));
    const total = items.length;
    return { items: paginate(items, opts.page || 1, opts.limit || 10).items, total };
  }

  async create(user: RequestUser, dto: CreateActivityDto): Promise<ActivityRecord> {
    this.assertRelatedExists(dto.relatedType, dto.relatedId);
    const ts = nowIso();
    const rec: ActivityRecord = {
      id: uid('a'),
      type: dto.type || 'EVENT',
      subject: dto.subject,
      description: dto.description || '',
      relatedType: dto.relatedType,
      relatedId: dto.relatedId,
      ownerId: forcedOwnerId(user, dto.ownerId),
      occurredAt: ts,
      createdAt: ts,
    };
    this.db.activities.unshift(rec);
    return rec;
  }

  async remove(user: RequestUser, id: string): Promise<void> {
    const idx = this.db.activities.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundError('Activité introuvable');
    enforceOwnership(user, this.db.activities[idx].ownerId);
    this.db.activities.splice(idx, 1);
  }

  private assertRelatedExists(type: RelatedEntityType, id: string): void {
    const exists =
      type === 'CUSTOMER' ? this.db.customers.some((c) => c.id === id)
      : type === 'LEAD' ? this.db.leads.some((l) => l.id === id)
      : this.db.deals.some((d) => d.id === id);
    if (!exists) throw new NotFoundError(`Entité liée ${type} ${id} introuvable`);
  }
}