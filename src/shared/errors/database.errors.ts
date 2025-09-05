import { BaseError } from './base.error';

export class DatabaseError extends BaseError {
  messageCode?: string | undefined;
  readonly statusCode = 500;
  readonly isOperational = true;

  constructor(message: string = 'Database operation failed', cause?: Error) {
    super(message, cause);
  }
}

export class UniqueConstraintError extends BaseError {
  messageCode?: string | undefined;
  readonly statusCode = 409;
  readonly isOperational = true;

  constructor(field: string) {
    super(`${field} already exists`);
  }
}
