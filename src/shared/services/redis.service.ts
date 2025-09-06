// src/shared/services/redis.service.ts
import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let isConnecting = false;

export function getRedisClient(): Redis {
  // Se già esiste, ritorna l'istanza esistente
  if (redisClient) {
    return redisClient;
  }

  // Previeni connessioni multiple simultanee
  if (isConnecting) {
    throw new Error('Redis is already connecting');
  }

  try {
    isConnecting = true;

    const options = {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.error('Redis max retries reached');
          return null;
        }
        return Math.min(times * 100, 2000);
      },
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    };

    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, options);
    } else {
      redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        ...options,
      });
    }

    // Registra gli event listener SOLO UNA VOLTA
    redisClient.once('connect', () => {
      logger.info('Redis connected successfully');
      isConnecting = false;
    });

    redisClient.once('ready', () => {
      logger.info('Redis ready');
    });

    // Usa 'on' solo per l'error handler
    redisClient.on('error', (err) => {
      // Log solo errori significativi, non ogni retry
      if (!err.message.includes('ECONNRESET') && !err.message.includes('max retries')) {
        logger.error('Redis error:', err.message);
      }
      isConnecting = false;
    });

    return redisClient;
  } catch (error) {
    isConnecting = false;
    logger.error('Failed to create Redis client', error);
    throw error;
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnecting = false;
  }
}
