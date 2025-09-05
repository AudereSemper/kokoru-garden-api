// src/modules/auth/auth.types.ts
import { FastifyRequest } from 'fastify';

// Request body types
export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface GoogleCodeRequest {
  code: string;
}

// Authenticated request type
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    role?: string;
    isEmailVerified: boolean;
  };
}

// Auth response types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  authProvider: 'local' | 'google';
  isEmailVerified: boolean;
  hasLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  onboardingStep: number;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: AuthUser;
    tokens: AuthTokens;
    requiresOnboarding: boolean;
    onboardingStep: number;
    isNewUser?: boolean;
  };
}

// Google OAuth types
export interface GoogleProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  firstName: string;
  lastName: string;
  picture?: string;
}

// Account status check
export interface AccountStatusCheck {
  isValid: boolean;
  message?: string;
}

// Rate limit check
export interface RateLimitCheck {
  canProceed: boolean;
  remainingAttempts?: number;
  resetTime?: Date;
}

// Email service types
export type EmailType = 'verification' | 'welcome' | 'passwordReset' | 'passwordChanged';

// Token types
export type TokenType = 'verification' | 'reset';

// JWT payload
export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
