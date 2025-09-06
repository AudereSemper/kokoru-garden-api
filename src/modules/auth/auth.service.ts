// src/modules/auth/auth.service.ts
import { IUserRepository } from './interfaces/user.repository.interface';
import { IPasswordService } from './interfaces/password.service.interface';
import { IEmailService } from './interfaces/email.service.interface';
import { IOAuthService } from './interfaces/oauth.service.interface';
import { IRateLimiter } from './interfaces/rate.limiter.interface';
import { RegisterRequest, LoginRequest, AuthTokens, AuthUser, JwtPayload } from './auth.types';
import {
  ConflictError,
  AuthenticationError,
  NotFoundError,
  InvalidTokenError,
  TokenExpiredError,
  AccountLockedError,
  RateLimitError,
} from '../../shared/errors';
import { logger } from '../../shared/utils/logger';
import { MESSAGE_CODES } from '../../shared/constants/message-codes';
import { MESSAGES } from '../../shared/constants/messages';
import { IAuthService } from './interfaces/auth.interfaces';
import { User } from '../../database/schema';
import { ITokenService } from "./interfaces/token.service.interface";

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly passwordService: IPasswordService,
    private readonly emailService: IEmailService,
    private readonly oauthService: IOAuthService,
    private readonly rateLimiter: IRateLimiter,
  ) {}

  /**
   * Register a new user
   */
  async registerUser(data: RegisterRequest): Promise<{
    user: AuthUser;
    tokens: AuthTokens;
    requiresOnboarding: boolean;
    onboardingStep: number;
  }> {
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError(MESSAGES[MESSAGE_CODES.AUTH_EMAIL_EXISTS]);
    }

    // Hash password
    const hashedPassword = await this.passwordService.hash(data.password);

    // Generate verification token
    const verificationToken = this.tokenService.generateRandomToken();
    const hashedToken = this.tokenService.hashToken(verificationToken);

    // Create user
    const userData = {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      authProvider: 'local' as const,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: this.getTokenExpiry('verification'),
      onboardingStep: 0,
    };

    const user = await this.userRepository.create(userData);

    // Generate JWT tokens
    const tokens = this.generateTokens(user.id, user.email);

    // Update user with refresh token
    await this.userRepository.update(user.id, {
      refreshToken: tokens.refreshToken,
      lastLoginAt: new Date(),
    });

    // Send verification email (non-blocking)
    this.sendEmailSafe(async () => {
      await this.emailService.sendVerificationEmail(user, verificationToken);
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
      requiresOnboarding: !user.hasCompletedOnboarding,
      onboardingStep: user.onboardingStep || 0,
    };
  }

  /**
   * Login user
   */
  async loginUser(data: LoginRequest): Promise<{
    user: AuthUser;
    tokens: AuthTokens;
    requiresOnboarding: boolean;
    onboardingStep: number;
  }> {
    // Find user
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new AuthenticationError();
    }

    // Check if Google account
    if (user.authProvider === 'google') {
      throw new AuthenticationError(MESSAGES[MESSAGE_CODES.AUTH_GOOGLE_ACCOUNT_REQUIRED]);
    }

    // Check account status
    await this.checkAccountStatus(user);

    // Verify password
    if (!user.password) {
      throw new AuthenticationError();
    }

    const isPasswordValid = await this.passwordService.compare(data.password, user.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id);
      throw new AuthenticationError();
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email);

    // Update user login info
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
      loginAttempts: 0,
      lockedUntil: null,
      refreshToken: tokens.refreshToken,
      hasLoggedIn: true,
    });

    // Send welcome email if first verified login
    if (!user.hasLoggedIn && user.isEmailVerified) {
      this.sendEmailSafe(async () => {
        await this.emailService.sendWelcomeEmail(user);
      });
    }

    return {
      user: this.sanitizeUser(user),
      tokens,
      requiresOnboarding: !user.hasCompletedOnboarding,
      onboardingStep: user.onboardingStep || 0,
    };
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await this.findUserByToken(token, 'verification');

    await this.userRepository.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    // Send welcome email if already logged in
    if (user.hasLoggedIn) {
      this.sendEmailSafe(async () => {
        await this.emailService.sendWelcomeEmail(user);
      });
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (user) {
      try {
        // Generate reset token
        const resetToken = this.tokenService.generateRandomToken();
        const hashedToken = this.tokenService.hashToken(resetToken);

        // Update user
        await this.userRepository.update(user.id, {
          passwordResetToken: hashedToken,
          passwordResetExpires: this.getTokenExpiry('reset'),
        });

        // Send reset email
        await this.emailService.sendPasswordResetEmail(user, resetToken);
      } catch (error) {
        logger.error('Password reset email failed:', error);
        // Don't throw - continue with success response for security
      }
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.findUserByToken(token, 'reset');

    // Hash new password
    const hashedPassword = await this.passwordService.hash(newPassword);

    // Update user
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      passwordChangedAt: new Date(),
      loginAttempts: 0,
      lockedUntil: null,
    });

    // Send confirmation email
    this.sendEmailSafe(async () => {
      await this.emailService.sendPasswordChangedEmail(user);
    });
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new InvalidTokenError();
    }

    // Verify refresh token
    let decoded: JwtPayload;
    try {
      decoded = this.tokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new InvalidTokenError();
    }

    // Find user with matching refresh token
    const user = await this.userRepository.findByRefreshToken(refreshToken);
    if (!user || user.id !== decoded.userId) {
      throw new InvalidTokenError();
    }

    // Generate new tokens
    const tokens = this.generateTokens(user.id, user.email);

    // Update refresh token
    await this.userRepository.update(user.id, {
      refreshToken: tokens.refreshToken,
    });

    return tokens;
  }

  /**
   * Logout user
   */
  async logoutUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      refreshToken: null,
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<{
    user: AuthUser;
    requiresOnboarding: boolean;
    onboardingStep: number;
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError();
    }

    return {
      user: this.sanitizeUser(user),
      requiresOnboarding: !user.hasCompletedOnboarding,
      onboardingStep: user.onboardingStep || 0,
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError();
    }

    if (user.isEmailVerified) {
      throw new AuthenticationError(MESSAGES[MESSAGE_CODES.AUTH_EMAIL_ALREADY_VERIFIED]);
    }

    // Check rate limit
    const rateLimitCheck = await this.rateLimiter.checkEmailResend(userId);
    if (!rateLimitCheck.canResend) {
      throw new RateLimitError(MESSAGES[MESSAGE_CODES.AUTH_VERIFICATION_RATE_LIMIT]);
    }

    // Generate new verification token
    const verificationToken = this.tokenService.generateRandomToken();
    const hashedToken = this.tokenService.hashToken(verificationToken);

    // Update user
    await this.userRepository.update(userId, {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: this.getTokenExpiry('verification'),
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(user, verificationToken);
  }

  /**
   * Google OAuth authentication
   */
  async authenticateWithGoogle(code: string): Promise<{
    user: AuthUser;
    tokens: AuthTokens;
    requiresOnboarding: boolean;
    onboardingStep: number;
    isNewUser: boolean;
  }> {
    // Process Google code and get profile
    const googleProfile = await this.oauthService.processGoogleCode(code);

    // Find or create user
    const { user, isNewUser } = await this.oauthService.findOrCreateGoogleUser(googleProfile);

    // Generate JWT tokens
    const tokens = this.generateTokens(user.id, user.email);

    // Update login info
    await this.userRepository.update(user.id, {
      refreshToken: tokens.refreshToken,
      lastLoginAt: new Date(),
      hasLoggedIn: true,
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
      requiresOnboarding: !user.hasCompletedOnboarding,
      onboardingStep: user.onboardingStep || 0,
      isNewUser,
    };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Generate JWT tokens
   */
  private generateTokens(userId: string, email: string): AuthTokens {
    const payload: JwtPayload = {
      userId,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  /**
   * Remove sensitive fields from user
   */
  private sanitizeUser(user: User): AuthUser {
    return {
      id: user.id!,
      email: user.email!,
      firstName: user.firstName!,
      lastName: user.lastName!,
      authProvider: user.authProvider!,
      isEmailVerified: user.isEmailVerified,
      hasLoggedIn: user.hasLoggedIn,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      onboardingStep: user.onboardingStep || 0,
      createdAt: user.createdAt,
    };
  }

  /**
   * Check account status
   */
  private async checkAccountStatus(user: User): Promise<void> {
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const lockTimeMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      throw new AccountLockedError(`Account locked. Try again in ${lockTimeMinutes} minutes.`);
    }
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(userId: string): Promise<void> {
    await this.userRepository.incrementLoginAttempts(userId);

    const rateLimitCheck = await this.rateLimiter.checkLoginAttempts(userId);
    if (!rateLimitCheck.canAttempt && rateLimitCheck.lockedUntil) {
      await this.userRepository.lockAccount(userId, rateLimitCheck.lockedUntil);
      throw new AccountLockedError();
    }
  }

  /**
   * Find user by token
   */
  private async findUserByToken(token: string, type: 'verification' | 'reset'): Promise<User> {
    if (!token) {
      throw new InvalidTokenError();
    }

    const hashedToken = this.tokenService.hashToken(token);

    const user =
      type === 'verification'
        ? await this.userRepository.findByEmailVerificationToken(hashedToken)
        : await this.userRepository.findByPasswordResetToken(hashedToken);

    if (!user) {
      throw new InvalidTokenError();
    }

    // Check if token is expired
    const expirationField =
      type === 'verification' ? user.emailVerificationExpires : user.passwordResetExpires;

    if (!expirationField || expirationField < new Date()) {
      throw new TokenExpiredError();
    }

    return user;
  }

  /**
   * Get token expiry date
   */
  private getTokenExpiry(type: 'verification' | 'reset'): Date {
    const expiryMs = type === 'verification' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // 24h vs 1h
    return new Date(Date.now() + expiryMs);
  }

  /**
   * Send email safely without blocking
   */
  private sendEmailSafe(emailOperation: () => Promise<void>): void {
    emailOperation().catch((error) => {
      logger.error('Email sending failed:', error);
      // Don't throw - email failures shouldn't block auth flow
    });
  }
}
