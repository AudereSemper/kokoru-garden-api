// src/modules/auth/services/rate-limiter.service.ts

import type { Redis } from 'ioredis';
import { IRateLimiter } from "./interfaces/rate.limiter.interface";

export class RateLimiterService implements IRateLimiter {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_WINDOW = 15 * 60; // 15 minutes in seconds
  private readonly EMAIL_RESEND_DELAY = 60; // 1 minute in seconds

  constructor(private readonly redis: Redis) {}

  async checkLoginAttempts(userId: string): Promise<{
    canAttempt: boolean;
    attemptsRemaining: number;
    lockedUntil?: Date;
  }> {
    const key = `login_attempts:${userId}`;
    const attempts = await this.redis.get(key);
    const attemptCount = parseInt(attempts || '0');

    if (attemptCount >= this.MAX_LOGIN_ATTEMPTS) {
      const ttl = await this.redis.ttl(key);
      if (ttl > 0) {
        return {
          canAttempt: false,
          attemptsRemaining: 0,
          lockedUntil: new Date(Date.now() + ttl * 1000),
        };
      }
    }

    return {
      canAttempt: true,
      attemptsRemaining: Math.max(0, this.MAX_LOGIN_ATTEMPTS - attemptCount),
    };
  }

  async recordFailedLogin(userId: string): Promise<void> {
    const key = `login_attempts:${userId}`;
    const attempts = await this.redis.incr(key);
    
    // Set expiry only on first attempt
    if (attempts === 1) {
      await this.redis.expire(key, this.LOGIN_WINDOW);
    }
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    const key = `login_attempts:${userId}`;
    await this.redis.del(key);
  }

  async checkEmailResend(userId: string): Promise<{
    canResend: boolean;
    nextAllowedAt?: Date;
  }> {
    const key = `email_resend:${userId}`;
    const lastSent = await this.redis.get(key);
    
    if (lastSent) {
      const timePassed = Date.now() - parseInt(lastSent);
      if (timePassed < this.EMAIL_RESEND_DELAY * 1000) {
        return {
          canResend: false,
          nextAllowedAt: new Date(parseInt(lastSent) + this.EMAIL_RESEND_DELAY * 1000),
        };
      }
    }

    // Record this attempt
    await this.redis.set(key, Date.now(), 'EX', this.EMAIL_RESEND_DELAY);
    
    return { canResend: true };
  }
}