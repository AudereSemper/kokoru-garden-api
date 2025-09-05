// src/app.ts
import Fastify from 'fastify';
import { logger } from './shared/utils/logger';
import { createContainer } from "./container";
import { authRoutes } from './modules/auth/auth.routes';

export async function buildApp() {
  const app = Fastify({
    logger: false, // Use Pino logger directly
    trustProxy: true,
    bodyLimit: 10485760, // 10MB limit
  });

  const container = createContainer();

  // =============================================================================
  // 📌 HTTP ERRORS PLUGIN
  // =============================================================================
  await app.register(import('@fastify/sensible'));

  // HELMET - Security headers
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });

  // CORS with same logic as Express
  await app.register(import('@fastify/cors'), {
    origin: (origin, callback) => {
      logger.debug(`CORS Check: ${origin}`);

      let allowedOrigins: string[] = [];

      if (process.env.NODE_ENV === 'production') {
        allowedOrigins = [
          'https://kokoru-garden.com',
          'https://www.kokoru-garden.com',
        ];

        if (process.env.FRONTEND_URL) {
          const additionalOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
          allowedOrigins = [...new Set([...allowedOrigins, ...additionalOrigins])];
        }
      } else {
        allowedOrigins = [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000',
        ];
      }

      // Allow no origin (Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        logger.debug(`Origin allowed: ${origin}`);
        return callback(null, true);
      } else {
        logger.warn(`Origin blocked: ${origin}`);
        return callback(new Error(`CORS policy blocks origin: ${origin}`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
  });

  // RATE LIMITING - Multiple strategies
  // General API limiter
  await app.register(import('@fastify/rate-limit'), {
    max: 150,
    timeWindow: 15 * 60 * 1000, // 15 minutes
    errorResponseBuilder: () => ({
      error: 'Rate Limit Exceeded',
      message: 'Troppe richieste da questo IP, riprova tra 15 minuti',
      statusCode: 429,
    }),
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  // Strict auth limiter (registered later on auth routes)
  const authLimiterOptions = {
    max: 5,
    timeWindow: 15 * 60 * 1000,
    skipOnError: true,
    errorResponseBuilder: () => ({
      error: 'Authentication Rate Limit',
      message: 'Troppi tentativi di autenticazione, riprova tra 15 minuti',
      statusCode: 429,
    }),
  };

  // =============================================================================
  // 📊 REQUEST LOGGING
  // =============================================================================
  app.addHook('onRequest', async (request) => {
    logger.info({
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    }, 'Incoming request');
  });

  app.addHook('onResponse', async (request, reply) => {
    logger.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    }, 'Request completed');
  });

  // =============================================================================
  // 📊 SWAGGER DOCUMENTATION
  // =============================================================================
  if (process.env.NODE_ENV !== 'production') {
    await app.register(import('@fastify/swagger'), {
      openapi: {
        info: {
          title: 'Kokoru Garden API',
          description: 'Bonsai management API',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'http://localhost:3000',
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    });

    await app.register(import('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false,
      },
    });
  }

  // =============================================================================
  // 🌍 CORE ROUTES
  // =============================================================================

  // Root endpoint
  app.get('/', async () => {
    return { 
      message: 'Kokoru Garden API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  });

  // Health check endpoint (with lighter rate limit)
  await app.register(async function healthRoutes(app) {
    await app.register(import('@fastify/rate-limit'), {
      max: 30,
      timeWindow: 60 * 1000, // 1 minute
    });

    app.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      };
    });

    app.get('/health/db', async () => {
      try {
        // TODO: Import testConnection when available
        // const isConnected = await testConnection();
        const isConnected = true; // Placeholder

        return {
          database: isConnected ? 'connected' : 'disconnected',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        logger.error('Database health check failed', error);
        throw app.httpErrors.serviceUnavailable('Database connection failed');
      }
    });
  });

  // =============================================================================
  // 📌 MODULE REGISTRATION
  // =============================================================================
  
  // Auth routes with strict rate limiting
  await app.register(async function authModule(app) {
    await app.register(import('@fastify/rate-limit'), authLimiterOptions);
    
    // Register real auth routes using your existing function
    await app.register(async function (app) {
      await authRoutes(app, container.authController);
    }, { prefix: '/api/auth' });
  });

  // API routes (will be implemented step by step)
  await app.register(async function apiRoutes(app) {
    // TODO: Register all API modules
    // await app.register(profilesRoutes, { prefix: '/api/profiles' });
    // await app.register(treesRoutes, { prefix: '/api/trees' });
    // await app.register(photosRoutes, { prefix: '/api/photos' });
    // await app.register(foldersRoutes, { prefix: '/api/folders' });
    
    app.get('/api/test', async () => {
      return { message: 'API working', timestamp: new Date().toISOString() };
    });
  });

  // =============================================================================
  // ⚠️ ERROR HANDLING
  // =============================================================================

  // Global error handler
  app.setErrorHandler(async (error, request, reply) => {
    logger.error({
      error: error.message,
      stack: error.stack,
      method: request.method,
      url: request.url,
    }, 'Request error');

    // Rate limit errors
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'Rate Limit Exceeded',
        message: 'Too many requests, please try again later',
        statusCode: 429,
      });
    }

    // CORS errors
    if (error.message.includes('CORS policy')) {
      return reply.status(403).send({
        error: 'CORS Error',
        message: 'Request blocked by CORS policy',
        statusCode: 403,
      });
    }

    // Validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
        statusCode: 400,
      });
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    return reply.status(statusCode).send({
      error: isProduction ? 'Internal Server Error' : error.name,
      message: isProduction ? 'Something went wrong' : error.message,
      statusCode,
      ...(isProduction ? {} : { stack: error.stack }),
    });
  });

  // 404 handler
  app.setNotFoundHandler(async (request, reply) => {
    logger.warn(`404 - ${request.method} ${request.url}`);
    
    return reply.status(404).send({
      error: 'Not Found',
      message: `Cannot ${request.method} ${request.url}`,
      statusCode: 404,
    });
  });

  return app;
}