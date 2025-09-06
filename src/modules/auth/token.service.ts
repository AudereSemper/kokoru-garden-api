// src/modules/auth/services/token.service.ts

import jwt, { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import type { Redis } from 'ioredis';
import { logger } from '../../shared/utils/logger';
import { ITokenService } from './interfaces/token.service.interface';
import { TokenExpiredError, InvalidTokenError } from '../../shared/errors';
import { JwtPayload } from './auth.types';

interface TokenServiceConfig {
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtEmailSecret: string;
  jwtResetSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
  issuer: string;
}

interface TokenServiceDeps {
  redis: Redis;
  config: TokenServiceConfig;
}

export class TokenService implements ITokenService {
  private readonly redis: Redis;
  private readonly config: TokenServiceConfig;

  // Token prefixes for Redis storage
  private readonly BLACKLIST_PREFIX = 'token:blacklist:';
  private readonly REFRESH_PREFIX = 'token:refresh:';
  private readonly SESSION_PREFIX = 'session:';

  constructor(deps: TokenServiceDeps) {
    this.redis = deps.redis;
    this.config = deps.config;
    this.validateConfig();
  }

  /**
   * Validates that all required config is present
   */
  private validateConfig(): void {
    const required = ['jwtAccessSecret', 'jwtRefreshSecret', 'jwtAccessExpiry', 'jwtRefreshExpiry'];

    for (const key of required) {
      if (!this.config[key as keyof TokenServiceConfig]) {
        throw new Error(`Missing required TokenService config: ${key}`);
      }
    }
  }

  /**
   * Normalizes expiry time to a format JWT understands
   * Converts pure numbers to seconds, keeps valid string formats
   */
  private normalizeExpiry(expiry: string): string | number {
    // If it's a pure number string, convert to number (seconds)
    if (/^\d+$/.test(expiry)) {
      return parseInt(expiry);
    }

    // If it has a valid JWT time format (1h, 7d, 30m, etc), keep as is
    if (/^\d+[smhdw]$/.test(expiry)) {
      return expiry;
    }

    // Default to 1 hour if format is unrecognized
    logger.warn(`Invalid expiry format: ${expiry}, defaulting to 1h`);
    return '1h';
  }

  /**
   * Generates an access token
   */
  generateAccessToken(payload: JwtPayload): string {
    const sessionId = this.generateSessionId();

    if (!payload.userId) {
      throw new InvalidTokenError('userId is required in payload');
    }

    const tokenPayload = {
      ...payload,
      sessionId,
      type: 'access',
    };

    const signOptions: jwt.SignOptions = {
      expiresIn: this.normalizeExpiry(this.config.jwtAccessExpiry) as number,
      issuer: this.config.issuer,
      audience: 'kokoru-garden',
      subject: String(payload.userId),
    };

    const token = jwt.sign(tokenPayload, this.config.jwtAccessSecret, signOptions);

    // Store session for tracking
    this.storeSession(sessionId, payload).catch((err) =>
      logger.error({ err }, 'Failed to store session'),
    );

    return token;
  }

  /**
   * Generates a refresh token
   */
  generateRefreshToken(payload: JwtPayload): string {
    const sessionId = this.generateSessionId();

    if (!payload.userId) {
      throw new InvalidTokenError('userId is required in payload');
    }

    const tokenPayload = {
      userId: payload.userId,
      sessionId,
      type: 'refresh',
    };

    const signOptions: jwt.SignOptions = {
      expiresIn: this.normalizeExpiry(this.config.jwtRefreshExpiry) as number,
      issuer: this.config.issuer,
    };

    const token = jwt.sign(tokenPayload, this.config.jwtRefreshSecret, signOptions);

    // Store refresh token for validation
    const ttl = this.parseTimeToSeconds(this.config.jwtRefreshExpiry);
    this.redis
      .setex(`${this.REFRESH_PREFIX}${sessionId}`, ttl, token)
      .catch((err) => logger.error({ err }, 'Failed to store refresh token'));

    return token;
  }

  /**
   * Verifies and returns the payload of an access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      // Verify token signature and expiration
      const decoded = jwt.verify(token, this.config.jwtAccessSecret, {
        issuer: this.config.issuer,
        audience: 'kokoru-garden',
      }) as JwtPayload & { sessionId?: string };

      // Check blacklist synchronously (blocking)
      // In production, consider making this async with a different interface
      this.isTokenBlacklisted(token).then((isBlacklisted) => {
        if (isBlacklisted) {
          logger.warn({ userId: decoded.userId }, 'Attempted to use blacklisted token');
        }
      });

      return {
        userId: decoded.userId,
        email: decoded.email,
        iat: decoded.iat,
        exp: decoded.exp,
      } as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError('Access token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new InvalidTokenError('Invalid access token');
      }

      logger.error({ error }, 'Token verification failed');
      throw new InvalidTokenError('Token verification failed');
    }
  }

  /**
   * Verifies and returns the payload of a refresh token
   */
  verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.config.jwtRefreshSecret, {
        issuer: this.config.issuer,
      }) as BaseJwtPayload & { userId: string; sessionId?: string };

      // For refresh token, we return minimal payload
      // The actual user data should be fetched from DB
      return {
        userId: decoded.userId,
        email: '', // Will be populated by the service layer
        iat: decoded.iat as number,
        exp: decoded.exp as number,
      } as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError('Refresh token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new InvalidTokenError('Invalid refresh token');
      }

      logger.error({ error }, 'Refresh token verification failed');
      throw new InvalidTokenError('Refresh token verification failed');
    }
  }

  /**
   * Generates a cryptographically secure random token
   */
  generateRandomToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Hashes a token using SHA256
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Revokes a token by adding it to blacklist
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as BaseJwtPayload;
      if (!decoded || !decoded.exp) return;

      // Calculate TTL until token natural expiration
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl <= 0) return; // Already expired

      // Add to blacklist with TTL
      await this.redis.setex(`${this.BLACKLIST_PREFIX}${this.hashToken(token)}`, ttl, '1');

      logger.info('Token revoked');
    } catch (error) {
      logger.error({ error }, 'Failed to revoke token');
      throw new InvalidTokenError('Failed to revoke token');
    }
  }

  /**
   * Revokes all tokens for a user by invalidating sessions
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Find all user sessions using scan
      const stream = this.redis.scanStream({
        match: `${this.SESSION_PREFIX}*`,
        count: 100,
      });

      const pipeline = this.redis.pipeline();

      for await (const keys of stream) {
        for (const key of keys) {
          const session = await this.redis.get(key);
          if (session) {
            const data = JSON.parse(session);
            if (data.userId === userId) {
              const sessionId = key.replace(this.SESSION_PREFIX, '');
              pipeline.del(key);
              pipeline.del(`${this.REFRESH_PREFIX}${sessionId}`);
            }
          }
        }
      }

      await pipeline.exec();
      logger.info({ userId }, 'All user tokens revoked');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to revoke user tokens');
      throw new InvalidTokenError('Failed to revoke all user tokens');
    }
  }

  // Additional methods for email and reset tokens (not in interface but useful)

  /**
   * Generates a token for email verification
   */
  async generateEmailToken(userId: string, email: string): Promise<string> {
    const token = this.generateRandomToken();
    const hashedToken = this.hashToken(token);

    // Store hashed token in Redis
    await this.redis.setex(
      `token:email:${hashedToken}`,
      86400, // 24 hours
      JSON.stringify({ userId, email }),
    );

    return token;
  }

  /**
   * Generates a password reset token
   */
  async generateResetToken(userId: string, email: string): Promise<string> {
    const token = this.generateRandomToken();
    const hashedToken = this.hashToken(token);

    // Store hashed token in Redis
    await this.redis.setex(
      `token:reset:${hashedToken}`,
      3600, // 1 hour
      JSON.stringify({ userId, email }),
    );

    return token;
  }

  /**
   * Verifies an email token
   */
  async verifyEmailToken(token: string): Promise<{ userId: string; email: string }> {
    const hashedToken = this.hashToken(token);
    const data = await this.redis.get(`token:email:${hashedToken}`);

    if (!data) {
      throw new InvalidTokenError('Invalid or expired email verification token');
    }

    // Delete token after use
    await this.redis.del(`token:email:${hashedToken}`);

    return JSON.parse(data);
  }

  /**
   * Verifies a reset token
   */
  async verifyResetToken(token: string): Promise<{ userId: string; email: string }> {
    const hashedToken = this.hashToken(token);
    const data = await this.redis.get(`token:reset:${hashedToken}`);

    if (!data) {
      throw new InvalidTokenError('Invalid or expired reset token');
    }

    // Delete token after use
    await this.redis.del(`token:reset:${hashedToken}`);

    return JSON.parse(data);
  }

  // Private helper methods

  private generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  private async storeSession(sessionId: string, payload: JwtPayload): Promise<void> {
    const ttl = this.parseTimeToSeconds(this.config.jwtRefreshExpiry);

    await this.redis.setex(
      `${this.SESSION_PREFIX}${sessionId}`,
      ttl,
      JSON.stringify({
        userId: payload.userId,
        email: payload.email,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const hashedToken = this.hashToken(token);
    const exists = await this.redis.exists(`${this.BLACKLIST_PREFIX}${hashedToken}`);
    return exists === 1;
  }

  private parseTimeToSeconds(time: string): number {
    // Handle numeric strings as seconds
    if (/^\d+$/.test(time)) {
      return parseInt(time);
    }

    // Handle time with units
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
      w: 604800,
    };

    const match = time.match(/^(\d+)([smhdw])$/);
    if (!match) {
      logger.warn(`Invalid time format: ${time}, defaulting to 1 hour`);
      return 3600;
    }

    return parseInt(match[1]!) * (units[match[2]!] || 1);
  }
}
