// src/modules/auth/services/password.service.ts

import argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { logger } from '../../shared/utils/logger';

export interface IPasswordService {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
  generateTemporaryPassword(): string;
  validatePasswordStrength(password: string): PasswordValidationResult;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number;
}

interface PasswordServiceConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  argon2Options?: argon2.Options;
}

interface PasswordServiceDeps {
  config?: PasswordServiceConfig;
}

export class PasswordService implements IPasswordService {
  private readonly config: PasswordServiceConfig;
  private readonly argon2Options: argon2.Options;

  constructor(deps?: PasswordServiceDeps) {
    // Default configuration
    this.config = {
      minLength: deps?.config?.minLength || 8,
      requireUppercase: deps?.config?.requireUppercase ?? true,
      requireLowercase: deps?.config?.requireLowercase ?? true,
      requireNumbers: deps?.config?.requireNumbers ?? true,
      requireSpecialChars: deps?.config?.requireSpecialChars ?? false,
      argon2Options: deps?.config?.argon2Options,
    };

    // Argon2 configuration optimized for security
    // Removed saltLength as it's not a valid option
    this.argon2Options = this.config.argon2Options || {
      type: argon2.argon2id, // Most secure variant
      memoryCost: 65536, // 64 MB
      timeCost: 3, // Number of iterations
      parallelism: 4, // Number of threads
    };
  }

  /**
   * Hashes a password using Argon2id
   */
  async hash(password: string): Promise<string> {
    try {
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }

      // Argon2 automatically generates a secure salt
      const hashedPassword = await argon2.hash(password, this.argon2Options);

      logger.debug('Password hashed successfully');
      return hashedPassword;
    } catch (error) {
      logger.error({ error }, 'Failed to hash password');
      throw new Error('Failed to process password');
    }
  }

  /**
   * Verifies a password against a hash
   */
  async verify(hash: string, password: string): Promise<boolean> {
    try {
      if (!hash || !password) {
        return false;
      }

      // Argon2 verify is timing-safe by default
      const isValid = await argon2.verify(hash, password);

      // Check if rehashing is needed (if options changed)
      if (isValid && (await argon2.needsRehash(hash, this.argon2Options))) {
        logger.info('Password needs rehashing with updated options');
        // Note: Actual rehashing should be done by the calling service
        // after successful authentication
      }

      return isValid;
    } catch (error) {
      logger.error({ error }, 'Failed to verify password');
      return false;
    }
  }

  /**
   * Compare password with hash (required by interface)
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return this.verify(hash, password);
  }

  /**
   * Validate password strength (SYNC as required by interface)
   */
  validateStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const result = this.validatePasswordStrength(password);
    return {
      isValid: result.isValid,
      errors: result.errors,
    };
  }

  /**
   * Generates a secure temporary password
   */
  generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const randomBytesBuffer = randomBytes(length);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[randomBytesBuffer[i]! % charset.length];
    }

    // Ensure it meets minimum requirements
    if (!this.hasUppercase(password)) {
      password = password.slice(0, -1) + 'A';
    }
    if (!this.hasLowercase(password)) {
      password = password.slice(0, -1) + 'a';
    }
    if (!this.hasNumber(password)) {
      password = password.slice(0, -1) + '1';
    }
    if (this.config.requireSpecialChars && !this.hasSpecialChar(password)) {
      password = password.slice(0, -1) + '!';
    }

    return password;
  }

  /**
   * Validates password strength based on configured rules
   */
  validatePasswordStrength(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;
    const maxScore = 5;

    // Check if password exists
    if (!password) {
      return {
        isValid: false,
        errors: ['Password is required'],
        score: 0,
      };
    }

    // Length check
    if (password.length < this.config.minLength) {
      errors.push(`Password must be at least ${this.config.minLength} characters long`);
    } else {
      score++;
      // Bonus points for extra length
      if (password.length >= 12) score += 0.5;
      if (password.length >= 16) score += 0.5;
    }

    // Uppercase check
    if (this.config.requireUppercase && !this.hasUppercase(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (this.hasUppercase(password)) {
      score++;
    }

    // Lowercase check
    if (this.config.requireLowercase && !this.hasLowercase(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (this.hasLowercase(password)) {
      score++;
    }

    // Number check
    if (this.config.requireNumbers && !this.hasNumber(password)) {
      errors.push('Password must contain at least one number');
    } else if (this.hasNumber(password)) {
      score++;
    }

    // Special character check
    if (this.config.requireSpecialChars && !this.hasSpecialChar(password)) {
      errors.push('Password must contain at least one special character');
    } else if (this.hasSpecialChar(password)) {
      score++;
    }

    // Check for common patterns (bonus deduction)
    if (this.hasCommonPatterns(password)) {
      errors.push('Password contains common patterns or sequences');
      score = Math.max(0, score - 1);
    }

    // Check for repeated characters
    if (this.hasRepeatedCharacters(password)) {
      errors.push('Password contains too many repeated characters');
      score = Math.max(0, score - 0.5);
    }

    // Normalize score to 0-5 range
    const normalizedScore = Math.min(maxScore, Math.max(0, score));

    return {
      isValid: errors.length === 0,
      errors,
      score: normalizedScore,
    };
  }

  /**
   * Checks if rehashing is needed (call after successful verification)
   */
  async needsRehash(hash: string): Promise<boolean> {
    try {
      return await argon2.needsRehash(hash, this.argon2Options);
    } catch (error) {
      logger.error({ error }, 'Failed to check rehash necessity');
      return false;
    }
  }

  // Private helper methods

  private hasUppercase(password: string): boolean {
    return /[A-Z]/.test(password);
  }

  private hasLowercase(password: string): boolean {
    return /[a-z]/.test(password);
  }

  private hasNumber(password: string): boolean {
    return /\d/.test(password);
  }

  private hasSpecialChar(password: string): boolean {
    return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  }

  private hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /123/,
      /abc/i,
      /qwerty/i,
      /password/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
      /monkey/i,
      /dragon/i,
    ];

    return commonPatterns.some((pattern) => pattern.test(password.toLowerCase()));
  }

  private hasRepeatedCharacters(password: string): boolean {
    // Check for 3+ repeated characters
    return /(.)\1{2,}/.test(password);
  }

  /**
   * Estimates time to crack password (for UI feedback)
   */
  estimateCrackTime(password: string): string {
    const validation = this.validatePasswordStrength(password);

    // Simple estimation based on score
    const timeEstimates = [
      'instantly', // score 0-1
      'a few seconds', // score 1-2
      'a few minutes', // score 2-3
      'a few hours', // score 3-4
      'several days', // score 4-4.5
      'months or years', // score 4.5-5
    ];

    const index = Math.min(timeEstimates.length - 1, Math.floor(validation.score));

    return timeEstimates[index]!;
  }
}
