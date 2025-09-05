import { FastifyInstance } from 'fastify';
import { handleError } from './error.handler';

export async function errorHandlerPlugin(fastify: FastifyInstance) {
  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    handleError(error, request, reply);
  });

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        message: `Cannot ${request.method} ${request.url}`,
        statusCode: 404,
      },
    });
  });
}
