import { DomainError, ValidationError, UnauthorizedError, NotFoundError, ConflictError } from './domain-error';

describe('domain-error', () => {
  describe('DomainError', () => {
    it('stores code and message', () => {
      const err = new DomainError('CUSTOM', 'Something went wrong');
      expect(err.code).toBe('CUSTOM');
      expect(err.message).toBe('Something went wrong');
      expect(err.name).toBe('DomainError');
    });
    it('is an Error instance', () => {
      const err = new DomainError('CUSTOM', 'msg');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('ValidationError', () => {
    it('has VALIDATION_ERROR code', () => {
      const err = new ValidationError('Invalid input');
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.message).toBe('Invalid input');
      expect(err).toBeInstanceOf(DomainError);
    });
    it('stores optional details', () => {
      const err = new ValidationError('Invalid', { field: 'email' });
      expect(err.details).toEqual({ field: 'email' });
    });
  });

  describe('UnauthorizedError', () => {
    it('has UNAUTHORIZED code by default', () => {
      const err = new UnauthorizedError('Not allowed');
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.forbidden).toBe(false);
    });
    it('has FORBIDDEN code when forbidden flag is true', () => {
      const err = new UnauthorizedError('Forbidden', true);
      expect(err.code).toBe('FORBIDDEN');
      expect(err.forbidden).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('has NOT_FOUND code', () => {
      const err = new NotFoundError();
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('Ressource introuvable');
    });
    it('accepts custom message', () => {
      const err = new NotFoundError('Client introuvable');
      expect(err.message).toBe('Client introuvable');
    });
  });

  describe('ConflictError', () => {
    it('has CONFLICT code', () => {
      const err = new ConflictError('Already exists');
      expect(err.code).toBe('CONFLICT');
      expect(err.message).toBe('Already exists');
    });
  });
});