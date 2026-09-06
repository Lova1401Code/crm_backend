import { isAdmin, enforceOwnership, ownerFilter, mergeFilters, assertCanAssignOwner, forcedOwnerId } from './rbac';
import { UnauthorizedError } from '../domain/domain-error';

const admin = { id: 'u-admin', role: 'ADMIN' };
const commercial = { id: 'u-comm-1', role: 'COMMERCIAL' };
const commercial2 = { id: 'u-comm-2', role: 'COMMERCIAL' };

describe('rbac', () => {
  describe('isAdmin', () => {
    it('returns true for ADMIN role', () => {
      expect(isAdmin(admin)).toBe(true);
    });
    it('returns false for COMMERCIAL role', () => {
      expect(isAdmin(commercial)).toBe(false);
    });
  });

  describe('enforceOwnership', () => {
    it('allows admin to access any resource', () => {
      expect(() => enforceOwnership(admin, 'u-comm-1')).not.toThrow();
    });
    it('allows commercial to access own resource', () => {
      expect(() => enforceOwnership(commercial, 'u-comm-1')).not.toThrow();
    });
    it('throws UnauthorizedError when commercial accesses other resource', () => {
      expect(() => enforceOwnership(commercial, 'u-comm-2')).toThrow(UnauthorizedError);
    });
    it('throws when commercial accesses unowned resource (null)', () => {
      expect(() => enforceOwnership(commercial, null)).toThrow(UnauthorizedError);
    });
  });

  describe('ownerFilter', () => {
    it('returns undefined for admin (no filter needed)', () => {
      expect(ownerFilter(admin)).toBeUndefined();
    });
    it('returns ownerId filter for commercial', () => {
      expect(ownerFilter(commercial)).toEqual({ ownerId: 'u-comm-1' });
    });
  });

  describe('mergeFilters', () => {
    it('returns undefined when no filters and admin', () => {
      expect(mergeFilters(admin, undefined)).toBeUndefined();
    });
    it('merges owner filter with incoming filters for commercial', () => {
      const result = mergeFilters(commercial, { status: 'NEW' });
      expect(result).toEqual({ status: 'NEW', ownerId: 'u-comm-1' });
    });
    it('returns only owner filter when no incoming filters for commercial', () => {
      expect(mergeFilters(commercial, undefined)).toEqual({ ownerId: 'u-comm-1' });
    });
  });

  describe('assertCanAssignOwner', () => {
    it('allows admin to assign any owner', () => {
      expect(() => assertCanAssignOwner(admin, 'u-comm-2')).not.toThrow();
    });
    it('allows commercial to assign self', () => {
      expect(() => assertCanAssignOwner(commercial, 'u-comm-1')).not.toThrow();
    });
    it('throws when commercial tries to assign another user', () => {
      expect(() => assertCanAssignOwner(commercial, 'u-comm-2')).toThrow(UnauthorizedError);
    });
    it('allows commercial to assign undefined owner', () => {
      expect(() => assertCanAssignOwner(commercial, undefined)).not.toThrow();
    });
  });

  describe('forcedOwnerId', () => {
    it('returns incoming ownerId for admin', () => {
      expect(forcedOwnerId(admin, 'u-comm-2')).toBe('u-comm-2');
    });
    it('returns admin id when no incoming owner for admin', () => {
      expect(forcedOwnerId(admin, undefined)).toBe('u-admin');
    });
    it('always returns commercial id regardless of incoming', () => {
      expect(forcedOwnerId(commercial, 'u-comm-2')).toBe('u-comm-1');
      expect(forcedOwnerId(commercial, undefined)).toBe('u-comm-1');
    });
  });
});