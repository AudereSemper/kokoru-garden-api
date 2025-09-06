// src/container.ts

import { AuthService } from './modules/auth/auth.service';
import { AuthController } from './modules/auth/auth.controller';
import { EmailService } from './modules/auth/email.service';
import { OAuthService } from './modules/auth/oauth.service';
import { PasswordService } from './modules/auth/password.service';
import { TokenService } from './modules/auth/token.service';
import { UserRepository } from './modules/auth/user.repository';
import { RateLimiterService } from './modules/auth/rate-limiter.service';
import { getRedisClient } from "./shared/services/redis.service";

export interface Container {
  authController: AuthController;
  authService: AuthService;
}

export function createContainer(): Container {
  // Redis
  const redis = getRedisClient();

  // Repositories
  const userRepository = new UserRepository();

  // Services
  const tokenService = new TokenService({
    redis,
    config: {
      jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
      jwtEmailSecret: process.env.JWT_EMAIL_SECRET!,
      jwtResetSecret: process.env.JWT_RESET_SECRET!,
      jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
      issuer: 'kokoru-garden',
    },
  });

  const passwordService = new PasswordService();
  const emailService = new EmailService(redis);
  const oauthService = new OAuthService(userRepository);
  const rateLimiter = new RateLimiterService(redis);

  // Main auth service
  const authService = new AuthService(
    userRepository,
    tokenService,
    passwordService,
    emailService,
    oauthService,
    rateLimiter,
  );

  // Controller
  const authController = new AuthController(authService);

  return {
    authController,
    authService,
  };
}
