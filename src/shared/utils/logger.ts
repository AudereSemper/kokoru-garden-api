// src/shared/utils/logger.ts
import pino from 'pino';

// Development logger with pretty printing
const devLogger = pino({
  level: process.env.LOG_LEVEL || 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      colorize: true,
      singleLine: false,
    },
  },
});

// Production logger - JSON format for better parsing
const prodLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['password', 'email', 'token', 'refreshToken', 'passwordResetToken'],
    censor: '[REDACTED]',
  },
});

// Export the appropriate logger based on environment
export const logger = process.env.NODE_ENV === 'production' ? prodLogger : devLogger;

// Helper functions for common logging patterns
export const logError = (error: unknown, context?: string) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(
    {
      err,
      context,
      stack: err.stack,
    },
    `Error${context ? ` in ${context}` : ''}: ${err.message}`,
  );
};

export const logRequest = (method: string, url: string, statusCode: number, duration: number) => {
  logger.info(
    {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
    },
    `${method} ${url} - ${statusCode} (${duration}ms)`,
  );
};

export const logDatabaseQuery = (query: string, duration?: number) => {
  logger.debug(
    {
      query,
      duration: duration ? `${duration}ms` : undefined,
    },
    `Database query${duration ? ` (${duration}ms)` : ''}`,
  );
};
