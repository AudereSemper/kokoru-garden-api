// src/server.ts
import { buildApp } from './app';
import { logger } from './shared/utils/logger';
import { testConnection, closeDatabase } from './database/connection';
import { closeRedis } from './shared/services/redis.service';

/**
 * Start the Fastify server with proper error handling and graceful shutdown
 */
async function start(): Promise<void> {
  try {
    // =============================================================================
    // 🔐 ENVIRONMENT VALIDATION
    // =============================================================================
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'SESSION_SECRET',
      // Auth tokens
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'JWT_EMAIL_SECRET',
      'JWT_RESET_SECRET',
      // Email service
      'RESEND_API_KEY',
      // Redis
      'REDIS_HOST',
      'REDIS_PORT',
    ];

    const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
    if (missingVars.length > 0) {
      logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
      process.exit(1);
    }

    // =============================================================================
    // 🗄️ DATABASE CONNECTION
    // =============================================================================
    logger.info('Connecting to database...');

    try {
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw new Error('Database connection failed');
    }

    // =============================================================================
    // 🚀 FASTIFY APP STARTUP
    // =============================================================================
    logger.info('Building Fastify application...');
    const app = await buildApp();

    // =============================================================================
    // 🌍 SERVER CONFIGURATION
    // =============================================================================
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    // Validate port
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid port: ${process.env.PORT}`);
    }

    // =============================================================================
    // 🎯 START SERVER
    // =============================================================================
    await app.listen({ port, host });

    logger.info(`🚀 Server running at http://${host}:${port}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

    if (process.env.NODE_ENV !== 'production') {
      logger.info(`📚 Swagger docs at http://${host}:${port}/docs`);
    }

    logger.info('✅ Kokoru Garden API is ready!');
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    await gracefulShutdown();
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(): Promise<void> {
  logger.info('🛑 Graceful shutdown initiated...');

  try {
    // Close database connections
    logger.info('Closing database connections...');
    await closeDatabase();
    logger.info('✅ Database connections closed');

    // Close Redis connections
    logger.info('Closing Redis connections...');
    await closeRedis();
    logger.info('✅ Redis connections closed');

    logger.info('✅ Graceful shutdown completed');
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
  }
}

// =============================================================================
// 🔄 PROCESS EVENT HANDLERS
// =============================================================================

// Handle graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  logger.info('📡 Received SIGINT signal');
  await gracefulShutdown();
  process.exit(0);
});

// Handle graceful shutdown on SIGTERM (Docker/K8s stop)
process.on('SIGTERM', async () => {
  logger.info('📡 Received SIGTERM signal');
  await gracefulShutdown();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚫 Unhandled Promise Rejection:', {
    reason,
    promise,
  });
  process.exit(1);
});

// =============================================================================
// 🎬 START THE SHOW
// =============================================================================
start();
