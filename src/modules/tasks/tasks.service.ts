import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { NotFoundError } from '../../common/domain/domain-error';
import {
  matchSearch, paginate, uid, nowIso, sortByCreatedAtDesc, applyQueryOptions,
} from '../../common/utils/repo-utils';
import {
  enforceOwnership, mergeFilters, assertCanAssignOwner, forcedOwnerId,
} from '../../common/rbac/rbac';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskRecord } from '../../infrastructure/mock/seed';
import { RequestUser } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class TasksService {
  constructor(private readonly db: MockDatabaseService) {}

  async findMany(user: RequestUser, opts: { page?: number; limit?: number; search?: string; filters?: Record<string, unknown>; sortBy?: string; sortOrder?: 'asc' | 'desc'; dateFrom?: string; dateTo?: string }) {
    let items = sortByCreatedAtDesc(this.db.tasks);
    const filters = mergeFilters(user, opts.filters);
    items = applyQueryOptions(items as unknown as Record<string, unknown>[], ['title', 'description'], { ...opts, filters }) as unknown as TaskRecord[];
    const total = items.length;
    return { items: paginate(items, opts.page || 1, opts.limit || 10).items, total };
  }

  async findOne(user: RequestUser, id: string): Promise<TaskRecord> {
    const t = this.db.tasks.find((x) => x.id === id);
    if (!t) throw new NotFoundError('Tâche introuvable');
    enforceOwnership(user, t.ownerId);
    return t;
  }

  async create(user: RequestUser, dto: CreateTaskDto): Promise<TaskRecord> {
    const ts = nowIso();
    const rec: TaskRecord = {
      id: uid('t'),
      title: dto.title,
      description: dto.description || '',
      dueDate: dto.dueDate,
      priority: dto.priority || 'MEDIUM',
      status: dto.status || 'OPEN',
      relatedType: dto.relatedType ?? null,
      relatedId: dto.relatedId ?? null,
      ownerId: forcedOwnerId(user, dto.ownerId),
      completedAt: dto.status === 'DONE' ? ts : null,
      createdAt: ts,
      updatedAt: ts,
    };
    this.db.tasks.push(rec);
    return rec;
  }

  async update(user: RequestUser, id: string, dto: UpdateTaskDto): Promise<TaskRecord> {
    const idx = this.db.tasks.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundError('Tâche introuvable');
    const t = this.db.tasks[idx];
    enforceOwnership(user, t.ownerId);
    if (dto.ownerId !== undefined) assertCanAssignOwner(user, dto.ownerId);
    const updated: TaskRecord = {
      ...t,
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.dueDate !== undefined && { dueDate: dto.dueDate }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.relatedType !== undefined && { relatedType: dto.relatedType }),
      ...(dto.relatedId !== undefined && { relatedId: dto.relatedId }),
      ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
      updatedAt: nowIso(),
    };
    this.db.tasks[idx] = updated;
    return updated;
  }

  async toggle(user: RequestUser, id: string): Promise<TaskRecord> {
    const idx = this.db.tasks.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundError('Tâche introuvable');
    const t = this.db.tasks[idx];
    enforceOwnership(user, t.ownerId);
    const ts = nowIso();
    const updated: TaskRecord = {
      ...t,
      status: t.status === 'DONE' ? 'OPEN' : 'DONE',
      completedAt: t.status === 'DONE' ? null : ts,
      updatedAt: ts,
    };
    this.db.tasks[idx] = updated;
    return updated;
  }

  async remove(user: RequestUser, id: string): Promise<void> {
    const idx = this.db.tasks.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundError('Tâche introuvable');
    enforceOwnership(user, this.db.tasks[idx].ownerId);
    this.db.tasks.splice(idx, 1);
  }
}