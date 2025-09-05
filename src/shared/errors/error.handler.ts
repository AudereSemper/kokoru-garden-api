import { FastifyRequest, FastifyReply } from 'fastify';
import { isOperationalError } from './index';
import { logger } from '../utils/logger';
import { MESSAGE_CODES } from '../constants/message-codes';
import { MESSAGES } from '../constants/messages';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    messageCode: string;
    statusCode: number;
    stack?: string;
    details?: unknown;
  };
}

export function handleError(error: Error, request: FastifyRequest, reply: FastifyReply): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error details
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    },
    'Request error occurred',
  );

  // Handle operational errors with message codes
  if (isOperationalError(error)) {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        messageCode: error.messageCode || MESSAGE_CODES.INTERNAL_SERVER_ERROR,
        statusCode: error.statusCode,
        ...(isProduction ? {} : { stack: error.stack }),
      },
    };

    reply.status(error.statusCode).send(response);
    return;
  }

  // Handle unexpected errors
  logger.error('Unexpected error occurred:', error);

  const response: ErrorResponse = {
    success: false,
    error: {
      message: isProduction ? MESSAGES[MESSAGE_CODES.INTERNAL_SERVER_ERROR] : error.message,
      messageCode: MESSAGE_CODES.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      ...(isProduction ? {} : { stack: error.stack }),
    },
  };

  reply.status(500).send(response);
}
