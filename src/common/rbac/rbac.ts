import { RequestUser } from '../guards/jwt-auth.guard';
import { UnauthorizedError } from '../domain/domain-error';

export function isAdmin(user: RequestUser): boolean {
  return user.role === 'ADMIN';
}

export function enforceOwnership(user: RequestUser, ownerId: string | null | undefined): void {
  if (isAdmin(user)) return;
  if (ownerId !== user.id) {
    throw new UnauthorizedError('Accès refusé : vous ne possédez pas cette ressource', true);
  }
}

export function ownerFilter(user: RequestUser): { ownerId?: string } | undefined {
  if (isAdmin(user)) return undefined;
  return { ownerId: user.id };
}

export function mergeFilters(
  user: RequestUser,
  incoming: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  const owner = ownerFilter(user);
  if (!incoming && !owner) return undefined;
  return { ...(incoming || {}), ...(owner || {}) };
}

export function assertCanAssignOwner(user: RequestUser, ownerId?: string | null): void {
  if (isAdmin(user)) return;
  if (ownerId !== undefined && ownerId !== user.id) {
    throw new UnauthorizedError('Vous ne pouvez pas réassigner cette ressource', true);
  }
}

export function forcedOwnerId(user: RequestUser, incoming?: string | null): string {
  if (isAdmin(user)) return incoming ?? user.id;
  return user.id;
}