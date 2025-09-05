import { BaseError } from "./base.error";

export * from './base.error';
export * from './auth.errors';
export * from './database.errors';

export function isOperationalError(error: Error): error is BaseError {
  return error instanceof BaseError && error.isOperational;
}