import { MESSAGE_CODES } from '../constants/message-codes';
import { MESSAGES } from '../constants/messages';
import { BaseError } from './base.error';

export class ValidationError extends BaseError {
  readonly statusCode = 400;
  readonly isOperational = true;
  readonly messageCode = MESSAGE_CODES.VALIDATION_ERROR;

  constructor(
    message: string = MESSAGES[MESSAGE_CODES.VALIDATION_ERROR],
    public readonly errors?: string[],
  ) {
    super(message);
  }
}

export class AuthenticationError extends BaseError {
  readonly statusCode = 401;
  readonly isOperational = true;
  readonly messageCode = MESSAGE_CODES.AUTH_INVALID_CREDENTIALS;

  constructor(message: string = MESSAGES[MESSAGE_CODES.AUTH_INVALID_CREDENTIALS]) {
    super(message);
  }
}

export class AuthorizationError extends BaseError {
  readonly statusCode = 403;
  readonly isOperational = true;
  readonly messageCode = MESSAGE_CODES.FORBIDDEN;

  constructor(message: string = MESSAGES[MESSAGE_CODES.FORBIDDEN]) {
    super(message);
  }
}

export class NotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly isOperational = true;
  readonly messageCode = MESSAGE_CODES.USER_NOT_FOUND;

  constructor(message: string = MESSAGES[MESSAGE_CODES.USER_NOT_FOUND]) {
    super(message);
  }
}

export class ConflictError extends BaseError {
  readonly statusCode = 409;
  readonly isOperational = true;
  readonly messageCode = MESSAGE_CODES.AUTH_EMAIL_EXISTS;

  constructor(message: string = MESSAGES[MESSAGE_CODES.AUTH_EMAIL_EXISTS]) {
    super(message);
  }
}

export class RateLimitError extends BaseError {
  readonly statusCode = 429;
  readonly isOperational = true;
  readonly messageCode = MESSAGE_CODES.AUTH_RATE_LIMIT_EXCEEDED;

  constructor(message: string = MESSAGES[MESSAGE_CODES.AUTH_RATE_LIMIT_EXCEEDED]) {
    super(message);
  }
}

export class AccountLockedError extends BaseError {
  readonly statusCode = 423;
  readonly isOperational = true;
  readonly messageCode = MESSAGE_CODES.AUTH_ACCOUNT_LOCKED;

  constructor(message: string = MESSAGES[MESSAGE_CODES.AUTH_ACCOUNT_LOCKED]) {
    super(message);
  }
}

export class TokenExpiredError extends BaseError {
  readonly statusCode = 401;
  readonly isOperational = true;
  readonly messageCode = MESSAGE_CODES.AUTH_TOKEN_EXPIRED;

  constructor(message: string = MESSAGES[MESSAGE_CODES.AUTH_TOKEN_EXPIRED]) {
    super(message);
  }
}

export class InvalidTokenError extends BaseError {
  readonly statusCode = 400;
  readonly isOperational = true;
  readonly messageCode = MESSAGE_CODES.AUTH_INVALID_TOKEN;

  constructor(message: string = MESSAGES[MESSAGE_CODES.AUTH_INVALID_TOKEN]) {
    super(message);
  }
}
