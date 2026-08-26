import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import {
  NotFoundError, UnauthorizedError,
} from '../../common/domain/domain-error';
import {
  matchSearch, paginate, uid, nowIso, sortByCreatedAtDesc,
} from '../../common/utils/repo-utils';
import {
  enforceOwnership, mergeFilters, assertCanAssignOwner, forcedOwnerId,
} from '../../common/rbac/rbac';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { CustomerRecord } from '../../infrastructure/mock/seed';
import { RequestUser } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class CustomersService {
  constructor(private readonly db: MockDatabaseService) {}

  async findMany(user: RequestUser, opts: { page?: number; limit?: number; search?: string; filters?: Record<string, unknown> }) {
    let items = sortByCreatedAtDesc(this.db.customers);
    items = matchSearch(items, opts.search || '', ['firstname', 'lastname', 'email', 'phone', 'company'] as (keyof CustomerRecord)[]);
    const filters = mergeFilters(user, opts.filters);
    items = items.filter((c) => !filters || Object.entries(filters).every(([k, v]) => v === undefined || v === null || v === '' || c[k as keyof CustomerRecord] === v));
    const total = items.length;
    return { items: paginate(items, opts.page || 1, opts.limit || 10).items, total };
  }

  async findOne(user: RequestUser, id: string): Promise<CustomerRecord> {
    const c = this.db.customers.find((x) => x.id === id);
    if (!c) throw new NotFoundError('Client introuvable');
    enforceOwnership(user, c.ownerId);
    return c;
  }

  async create(user: RequestUser, dto: CreateCustomerDto): Promise<CustomerRecord> {
    assertCanAssignOwner(user, dto.ownerId);
    const ts = nowIso();
    const rec: CustomerRecord = {
      id: uid('c'),
      firstname: dto.firstname,
      lastname: dto.lastname,
      company: dto.company || '',
      email: dto.email || '',
      phone: dto.phone || '',
      address: dto.address || '',
      city: dto.city || '',
      country: dto.country || 'France',
      ownerId: forcedOwnerId(user, dto.ownerId),
      createdAt: ts,
      updatedAt: ts,
    };
    this.db.customers.push(rec);
    return rec;
  }

  async update(user: RequestUser, id: string, dto: UpdateCustomerDto): Promise<CustomerRecord> {
    const idx = this.db.customers.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundError('Client introuvable');
    const c = this.db.customers[idx];
    enforceOwnership(user, c.ownerId);
    if (dto.ownerId !== undefined) assertCanAssignOwner(user, dto.ownerId);
    const updated: CustomerRecord = {
      ...c,
      ...(dto.firstname !== undefined && { firstname: dto.firstname }),
      ...(dto.lastname !== undefined && { lastname: dto.lastname }),
      ...(dto.company !== undefined && { company: dto.company }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.country !== undefined && { country: dto.country }),
      ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
      updatedAt: nowIso(),
    };
    this.db.customers[idx] = updated;
    return updated;
  }

  async remove(user: RequestUser, id: string): Promise<void> {
    const idx = this.db.customers.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundError('Client introuvable');
    enforceOwnership(user, this.db.customers[idx].ownerId);
    this.db.customers.splice(idx, 1);
  }
}