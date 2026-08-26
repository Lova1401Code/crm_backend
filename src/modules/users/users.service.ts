import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { PasswordHasherService } from '../../infrastructure/security/password-hasher.service';
import { toPublicUser, PublicUser } from '../auth/auth.service';
import {
  ConflictError, NotFoundError, ValidationError,
} from '../../common/domain/domain-error';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { matchSearch, paginate, uid, nowIso, sortByCreatedAtDesc } from '../../common/utils/repo-utils';
import { UserRecord } from '../../infrastructure/mock/seed';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: MockDatabaseService,
    private readonly hasher: PasswordHasherService,
  ) {}

  private isEmailUnique(email: string, excludeId?: string): boolean {
    return !this.db.users.some((u) => u.email === email && u.id !== excludeId);
  }

  async findMany(opts: { page?: number; limit?: number; search?: string }) {
    let items = sortByCreatedAtDesc(this.db.users);
    items = matchSearch(items, opts.search || '', ['firstname', 'lastname', 'email', 'phone'] as (keyof UserRecord)[]);
    const total = items.length;
    const page = opts.page || 1;
    const limit = opts.limit || 10;
    const slice = paginate(items, page, limit).items;
    return { items: slice.map(toPublicUser), total };
  }

  async findOne(id: string): Promise<PublicUser> {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) throw new NotFoundError('Utilisateur introuvable');
    return toPublicUser(user);
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    if (!this.isEmailUnique(dto.email)) {
      throw new ConflictError('Email déjà utilisé');
    }
    const ts = nowIso();
    const user: UserRecord = {
      id: uid('u'),
      firstname: dto.firstname,
      lastname: dto.lastname,
      email: dto.email,
      phone: dto.phone || '',
      role: dto.role || 'COMMERCIAL',
      status: 'ACTIVE',
      password: this.hasher.hash(dto.password),
      createdAt: ts,
      updatedAt: ts,
    };
    this.db.users.push(user);
    return toPublicUser(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const idx = this.db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new NotFoundError('Utilisateur introuvable');
    if (dto.email && !this.isEmailUnique(dto.email, id)) {
      throw new ConflictError('Email déjà utilisé');
    }
    const user = this.db.users[idx];
    const updated: UserRecord = {
      ...user,
      ...(dto.firstname !== undefined && { firstname: dto.firstname }),
      ...(dto.lastname !== undefined && { lastname: dto.lastname }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.password !== undefined && { password: this.hasher.hash(dto.password) }),
      updatedAt: nowIso(),
    };
    this.db.users[idx] = updated;
    return toPublicUser(updated);
  }

  async remove(id: string, actorId: string): Promise<void> {
    if (id === actorId) throw new ValidationError('Impossible de se supprimer soi-même');
    const idx = this.db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new NotFoundError('Utilisateur introuvable');
    this.db.users.splice(idx, 1);
  }
}