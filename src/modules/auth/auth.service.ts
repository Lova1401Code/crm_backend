import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { PasswordHasherService } from '../../infrastructure/security/password-hasher.service';
import { TokenService } from '../../infrastructure/security/token.service';
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} from '../../common/domain/domain-error';
import type { UserRecord } from '../../infrastructure/mock/seed';

export interface PublicUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function toPublicUser(u: UserRecord): PublicUser {
  const { password, ...rest } = u;
  return rest;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: MockDatabaseService,
    private readonly hasher: PasswordHasherService,
    private readonly tokens: TokenService,
  ) {}

  async login(email: string, password: string) {
    if (!email || !password) throw new ValidationError('Email et mot de passe requis');
    const user = this.db.users.find((u) => u.email === email);
    if (!user) throw new UnauthorizedError('Identifiants invalides');
    if (user.status === 'DISABLED') throw new UnauthorizedError('Compte désactivé');
    if (!this.hasher.compare(password, user.password)) {
      throw new UnauthorizedError('Identifiants invalides');
    }
    const token = this.tokens.encode({ sub: user.id, role: user.role });
    return { token, user: toPublicUser(user) };
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new NotFoundError('Utilisateur introuvable');
    return toPublicUser(user);
  }

  async logout() {
    return;
  }
}