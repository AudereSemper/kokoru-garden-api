// src/modules/auth/interfaces/auth.service.interface.ts
import { RegisterRequest, LoginRequest, AuthTokens, AuthUser } from '../auth.types';

export interface IAuthService {
  // User registration and authentication
  registerUser(data: RegisterRequest): Promise<{
    user: AuthUser;
    tokens: AuthTokens;
    requiresOnboarding: boolean;
    onboardingStep: number;
  }>;

  loginUser(data: LoginRequest): Promise<{
    user: AuthUser;
    tokens: AuthTokens;
    requiresOnboarding: boolean;
    onboardingStep: number;
  }>;

  // Email verification
  verifyEmail(token: string): Promise<{
    user: AuthUser;
    tokens: AuthTokens;
  }>;
  resendVerificationEmail(userId: string): Promise<void>;

  // Password management
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;

  // Token management
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  logoutUser(userId: string): Promise<void>;

  // User info
  getCurrentUser(userId: string): Promise<{
    user: AuthUser;
    requiresOnboarding: boolean;
    onboardingStep: number;
  }>;

  // OAuth
  authenticateWithGoogle(code: string): Promise<{
    user: AuthUser;
    tokens: AuthTokens;
    requiresOnboarding: boolean;
    onboardingStep: number;
    isNewUser: boolean;
  }>;
}
