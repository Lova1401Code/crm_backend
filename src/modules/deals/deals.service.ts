import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { ActivityLoggerService } from '../../common/services/activity-logger.service';
import { CustomersService } from '../customers/customers.service';
import {
  NotFoundError, UnauthorizedError, ValidationError,
} from '../../common/domain/domain-error';
import {
  matchSearch, paginate, uid, nowIso, sortByCreatedAtDesc, applyQueryOptions,
} from '../../common/utils/repo-utils';
import {
  enforceOwnership, mergeFilters, assertCanAssignOwner, forcedOwnerId,
} from '../../common/rbac/rbac';
import { CreateDealDto, UpdateDealDto } from './dto/deal.dto';
import { DealRecord } from '../../infrastructure/mock/seed';
import { RequestUser } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class DealsService {
  constructor(
    private readonly db: MockDatabaseService,
    private readonly logger: ActivityLoggerService,
    private readonly customers: CustomersService,
  ) {}

  async findMany(user: RequestUser, opts: { page?: number; limit?: number; search?: string; filters?: Record<string, unknown>; sortBy?: string; sortOrder?: 'asc' | 'desc'; dateFrom?: string; dateTo?: string }) {
    let items = sortByCreatedAtDesc(this.db.deals);
    const filters = mergeFilters(user, opts.filters);
    items = applyQueryOptions(items as unknown as Record<string, unknown>[], ['title'], { ...opts, filters }) as unknown as DealRecord[];
    const total = items.length;
    return { items: paginate(items, opts.page || 1, opts.limit || 10).items, total };
  }

  async findOne(user: RequestUser, id: string): Promise<DealRecord> {
    const d = this.db.deals.find((x) => x.id === id);
    if (!d) throw new NotFoundError('Affaire introuvable');
    enforceOwnership(user, d.ownerId);
    return d;
  }

  async create(user: RequestUser, dto: CreateDealDto): Promise<DealRecord> {
    const customer = await this.customers.findOne(user, dto.customerId);
    assertCanAssignOwner(user, dto.ownerId);
    const ts = nowIso();
    const ownerId = forcedOwnerId(user, dto.ownerId);
    const rec: DealRecord = {
      id: uid('d'),
      title: dto.title,
      customerId: customer.id,
      amount: dto.amount ?? 0,
      stage: dto.stage || 'PROSPECT',
      expectedCloseDate: dto.expectedCloseDate || '',
      notes: dto.notes || '',
      ownerId,
      createdAt: ts,
      updatedAt: ts,
    };
    this.db.deals.push(rec);
    this.logger.log({
      subject: 'Affaire créée',
      relatedType: 'DEAL',
      relatedId: rec.id,
      ownerId,
    });
    return rec;
  }

  async update(user: RequestUser, id: string, dto: UpdateDealDto): Promise<DealRecord> {
    const idx = this.db.deals.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundError('Affaire introuvable');
    const d = this.db.deals[idx];
    enforceOwnership(user, d.ownerId);
    if (dto.ownerId !== undefined) assertCanAssignOwner(user, dto.ownerId);
    if (dto.customerId !== undefined && dto.customerId !== d.customerId) {
      await this.customers.findOne(user, dto.customerId);
    }

    const prevStage = d.stage;
    const updated: DealRecord = {
      ...d,
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.customerId !== undefined && { customerId: dto.customerId }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.stage !== undefined && { stage: dto.stage }),
      ...(dto.expectedCloseDate !== undefined && { expectedCloseDate: dto.expectedCloseDate }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
      updatedAt: nowIso(),
    };
    this.db.deals[idx] = updated;

    if (dto.stage !== undefined && dto.stage !== prevStage) {
      this.logger.log({
        subject: `Étape mise à jour : ${prevStage} → ${dto.stage}`,
        relatedType: 'DEAL',
        relatedId: updated.id,
        ownerId: updated.ownerId,
      });
      if (dto.stage === 'WON') {
        this.logger.log({ subject: 'Affaire gagnée', relatedType: 'DEAL', relatedId: updated.id, ownerId: updated.ownerId });
      } else if (dto.stage === 'LOST') {
        this.logger.log({ subject: 'Affaire perdue', relatedType: 'DEAL', relatedId: updated.id, ownerId: updated.ownerId });
      }
    }
    return updated;
  }

  async remove(user: RequestUser, id: string): Promise<void> {
    const idx = this.db.deals.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundError('Affaire introuvable');
    enforceOwnership(user, this.db.deals[idx].ownerId);
    this.db.deals.splice(idx, 1);
  }
}