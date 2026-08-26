import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { ActivityLoggerService } from '../../common/services/activity-logger.service';
import {
  ConflictError, NotFoundError,
} from '../../common/domain/domain-error';
import {
  matchSearch, paginate, uid, nowIso, sortByCreatedAtDesc,
} from '../../common/utils/repo-utils';
import {
  enforceOwnership, mergeFilters, assertCanAssignOwner, forcedOwnerId,
} from '../../common/rbac/rbac';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { LeadRecord, CustomerRecord } from '../../infrastructure/mock/seed';
import { RequestUser } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class LeadsService {
  constructor(
    private readonly db: MockDatabaseService,
    private readonly logger: ActivityLoggerService,
  ) {}

  async findMany(user: RequestUser, opts: { page?: number; limit?: number; search?: string; filters?: Record<string, unknown> }) {
    let items = sortByCreatedAtDesc(this.db.leads);
    items = matchSearch(items, opts.search || '', ['firstname', 'lastname', 'email', 'phone', 'company'] as (keyof LeadRecord)[]);
    const filters = mergeFilters(user, opts.filters);
    items = items.filter((l) => !filters || Object.entries(filters).every(([k, v]) => v === undefined || v === null || v === '' || l[k as keyof LeadRecord] === v));
    const total = items.length;
    return { items: paginate(items, opts.page || 1, opts.limit || 10).items, total };
  }

  async findOne(user: RequestUser, id: string): Promise<LeadRecord> {
    const l = this.db.leads.find((x) => x.id === id);
    if (!l) throw new NotFoundError('Prospect introuvable');
    enforceOwnership(user, l.ownerId);
    return l;
  }

  async create(user: RequestUser, dto: CreateLeadDto): Promise<LeadRecord> {
    assertCanAssignOwner(user, dto.ownerId);
    const ts = nowIso();
    const rec: LeadRecord = {
      id: uid('l'),
      firstname: dto.firstname,
      lastname: dto.lastname,
      company: dto.company || '',
      email: dto.email || '',
      phone: dto.phone || '',
      source: dto.source || '',
      status: dto.status || 'NEW',
      ownerId: forcedOwnerId(user, dto.ownerId),
      createdAt: ts,
      updatedAt: ts,
    };
    this.db.leads.push(rec);
    return rec;
  }

  async update(user: RequestUser, id: string, dto: UpdateLeadDto): Promise<LeadRecord> {
    const idx = this.db.leads.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundError('Prospect introuvable');
    const l = this.db.leads[idx];
    enforceOwnership(user, l.ownerId);
    if (dto.ownerId !== undefined) assertCanAssignOwner(user, dto.ownerId);
    const updated: LeadRecord = {
      ...l,
      ...(dto.firstname !== undefined && { firstname: dto.firstname }),
      ...(dto.lastname !== undefined && { lastname: dto.lastname }),
      ...(dto.company !== undefined && { company: dto.company }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.source !== undefined && { source: dto.source }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
      updatedAt: nowIso(),
    };
    this.db.leads[idx] = updated;
    return updated;
  }

  async remove(user: RequestUser, id: string): Promise<void> {
    const idx = this.db.leads.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundError('Prospect introuvable');
    enforceOwnership(user, this.db.leads[idx].ownerId);
    this.db.leads.splice(idx, 1);
  }

  async convert(user: RequestUser, leadId: string): Promise<{ customer: CustomerRecord }> {
    const lead = this.db.leads.find((x) => x.id === leadId);
    if (!lead) throw new NotFoundError('Prospect introuvable');
    enforceOwnership(user, lead.ownerId);
    if (lead.status === 'CONVERTED') {
      throw new ConflictError('Ce prospect est déjà converti');
    }

    const ts = nowIso();
    const customer: CustomerRecord = {
      id: uid('c'),
      firstname: lead.firstname,
      lastname: lead.lastname,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      address: '',
      city: '',
      country: 'France',
      ownerId: lead.ownerId,
      createdAt: ts,
      updatedAt: ts,
    };
    this.db.customers.push(customer);

    const idx = this.db.leads.findIndex((x) => x.id === leadId);
    this.db.leads[idx] = { ...lead, status: 'CONVERTED', updatedAt: ts };

    this.logger.log({
      type: 'EVENT',
      subject: 'Prospect converti en client',
      relatedType: 'LEAD',
      relatedId: lead.id,
      ownerId: lead.ownerId,
    });
    this.logger.log({
      type: 'EVENT',
      subject: 'Nouveau client créé depuis un prospect',
      relatedType: 'CUSTOMER',
      relatedId: customer.id,
      ownerId: customer.ownerId,
    });

    return { customer };
  }
}