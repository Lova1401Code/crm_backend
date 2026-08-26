export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly details?: unknown) {
    super('VALIDATION_ERROR', message);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string, public readonly forbidden = false) {
    super(forbidden ? 'FORBIDDEN' : 'UNAUTHORIZED', message);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Ressource introuvable') {
    super('NOT_FOUND', message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super('CONFLICT', message);
  }
}