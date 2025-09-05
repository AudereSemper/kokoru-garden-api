// src/modules/auth/user.repository.ts
import { eq, and, gt, sql } from 'drizzle-orm';
import { db } from '../../database/connection';
import { users, type User, type NewUser } from '../../database/schema/tables/users.table';
import { IUserRepository } from './interfaces/user.repository.interface';
import { DatabaseError, UniqueConstraintError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/utils/logger';

export class UserRepository implements IUserRepository {

  /**
   * Validate and sanitize user ID
   */
  private validateUserId(id: string): string {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Invalid user ID format');
    }
    
    // UUID v4 validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ValidationError('Invalid user ID format');
    }
    
    return id.toLowerCase();
  }

  /**
   * Validate and sanitize email
   */
  private validateEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Invalid email format');
    }

    const sanitizedEmail = email.toLowerCase().trim();
    
    // Email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitizedEmail) || sanitizedEmail.length > 255) {
      throw new ValidationError('Invalid email format');
    }

    return sanitizedEmail;
  }

  /**
   * Sanitize database errors to prevent information leakage
   */
  private sanitizeError(error: unknown, operation: string): never {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (error instanceof Error) {
      // Log full error for debugging
      logger.error(`Database operation failed: ${operation}`, {
        error: error.message,
        stack: isProduction ? undefined : error.stack,
      });

      // Handle specific database errors
      if (error.message.includes('unique constraint')) {
        if (error.message.includes('email')) {
          throw new UniqueConstraintError('Email');
        }
        throw new UniqueConstraintError('User data');
      }

      if (error.message.includes('timeout') || error.message.includes('connection')) {
        throw new DatabaseError('Database connection issue');
      }
    }

    // Generic error for production
    throw new DatabaseError(isProduction ? 'Database operation failed' : `Failed to ${operation}`);
  }

  /**
   * Execute query with timeout protection
   */
  private async executeWithTimeout<T>(
    queryPromise: Promise<T>, 
    timeoutMs: number = 5000,
    operation: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
    });

    try {
      return await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      this.sanitizeError(error, operation);
    }
  }

  /**
   * Add artificial delay for timing attack protection
   */
  private async addSecurityDelay(): Promise<void> {
    const delay = Math.floor(Math.random() * 100) + 50; // 50-150ms random delay
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const validatedId = this.validateUserId(id);

    const queryPromise = db
      .select()
      .from(users)
      .where(eq(users.id, validatedId))
      .limit(1);

    try {
      const result = await this.executeWithTimeout(queryPromise, 3000, 'find user by ID');
      return result[0] || null;
    } catch (error) {
      this.sanitizeError(error, 'find user by ID');
    }
  }

  /**
   * Find user by email with timing attack protection
   */
  async findByEmail(email: string): Promise<User | null> {
    const validatedEmail = this.validateEmail(email);
    
    const queryPromise = db
      .select()
      .from(users)
      .where(eq(users.email, validatedEmail))
      .limit(1);

    try {
      const result = await this.executeWithTimeout(queryPromise, 3000, 'find user by email');
      
      // Always add delay to prevent timing attacks
      await this.addSecurityDelay();
      
      return result[0] || null;
    } catch (error) {
      await this.addSecurityDelay();
      this.sanitizeError(error, 'find user by email');
    }
  }

  /**
   * Create new user with transaction
   */
  async create(userData: NewUser): Promise<User> {
    // Validate input data
    if (userData.email) {
      userData.email = this.validateEmail(userData.email);
    }

    // Sanitize string fields
    if (userData.googleId) {
      userData.googleId = userData.googleId.trim().substring(0, 100);
    }

    try {
      // Use transaction for atomic operation
      const result = await db.transaction(async (tx) => {
        const created = await tx
          .insert(users)
          .values(userData)
          .returning();
        
        if (!created[0]) {
          throw new DatabaseError('Failed to create user - no data returned');
        }
        
        return created[0];
      });

      return result;
    } catch (error) {
      this.sanitizeError(error, 'create user');
    }
  }

  /**
   * Update user with input validation
   */
  async update(id: string, data: Partial<User>): Promise<User | null> {
    const validatedId = this.validateUserId(id);

    // Remove undefined values, id, and sensitive fields that shouldn't be updated directly
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => 
        value !== undefined && 
        key !== 'id' && 
        key !== 'createdAt'
      )
    );

    // Validate email if being updated
    if (cleanData.email) {
      cleanData.email = this.validateEmail(cleanData.email as string);
    }

    // Sanitize string fields  
    if (cleanData.googleId) {
      cleanData.googleId = (cleanData.googleId as string).trim().substring(0, 100);
    }

    // Add timestamp
    cleanData.updatedAt = new Date();

    try {
      const queryPromise = db
        .update(users)
        .set(cleanData)
        .where(eq(users.id, validatedId))
        .returning();

      const result = await this.executeWithTimeout(queryPromise, 3000, 'update user');
      return result[0] || null;
    } catch (error) {
      this.sanitizeError(error, 'update user');
    }
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    const validatedId = this.validateUserId(id);

    try {
      const queryPromise = db
        .delete(users)
        .where(eq(users.id, validatedId))
        .returning({ id: users.id });

      const result = await this.executeWithTimeout(queryPromise, 3000, 'delete user');
      return result.length > 0;
    } catch (error) {
      this.sanitizeError(error, 'delete user');
    }
  }

  /**
   * Find user by email verification token with timing protection
   */
  async findByEmailVerificationToken(hashedToken: string): Promise<User | null> {
    if (!hashedToken || typeof hashedToken !== 'string') {
      await this.addSecurityDelay();
      return null;
    }

    try {
      const queryPromise = db
        .select()
        .from(users)
        .where(
          and(
            eq(users.emailVerificationToken, hashedToken),
            gt(users.emailVerificationExpires, new Date())
          )
        )
        .limit(1);

      const result = await this.executeWithTimeout(queryPromise, 3000, 'find user by verification token');
      await this.addSecurityDelay();
      
      return result[0] || null;
    } catch (error) {
      await this.addSecurityDelay();
      this.sanitizeError(error, 'find user by verification token');
    }
  }

  /**
   * Find user by password reset token with timing protection
   */
  async findByPasswordResetToken(hashedToken: string): Promise<User | null> {
    if (!hashedToken || typeof hashedToken !== 'string') {
      await this.addSecurityDelay();
      return null;
    }

    try {
      const queryPromise = db
        .select()
        .from(users)
        .where(
          and(
            eq(users.passwordResetToken, hashedToken),
            gt(users.passwordResetExpires, new Date())
          )
        )
        .limit(1);

      const result = await this.executeWithTimeout(queryPromise, 3000, 'find user by reset token');
      await this.addSecurityDelay();
      
      return result[0] || null;
    } catch (error) {
      await this.addSecurityDelay();
      this.sanitizeError(error, 'find user by reset token');
    }
  }

  /**
   * Find user by refresh token with timing protection
   */
  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    if (!refreshToken || typeof refreshToken !== 'string') {
      await this.addSecurityDelay();
      return null;
    }

    try {
      const queryPromise = db
        .select()
        .from(users)
        .where(eq(users.refreshToken, refreshToken))
        .limit(1);

      const result = await this.executeWithTimeout(queryPromise, 3000, 'find user by refresh token');
      await this.addSecurityDelay();
      
      return result[0] || null;
    } catch (error) {
      await this.addSecurityDelay();
      this.sanitizeError(error, 'find user by refresh token');
    }
  }

  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    if (!googleId || typeof googleId !== 'string') {
      return null;
    }

    try {
      const queryPromise = db
        .select()
        .from(users)
        .where(eq(users.googleId, googleId))
        .limit(1);

      const result = await this.executeWithTimeout(queryPromise, 3000, 'find user by Google ID');
      return result[0] || null;
    } catch (error) {
      this.sanitizeError(error, 'find user by Google ID');
    }
  }

  /**
   * Increment login attempts atomically
   */
  async incrementLoginAttempts(id: string): Promise<void> {
    const validatedId = this.validateUserId(id);

    try {
      // Use SQL for atomic increment to prevent race conditions
      await this.executeWithTimeout(
        db.execute(sql`
          UPDATE users 
          SET login_attempts = login_attempts + 1, updated_at = NOW() 
          WHERE id = ${validatedId}
        `),
        3000,
        'increment login attempts'
      );
    } catch (error) {
      this.sanitizeError(error, 'increment login attempts');
    }
  }

  /**
   * Reset login attempts
   */
  async resetLoginAttempts(id: string): Promise<void> {
    const validatedId = this.validateUserId(id);

    try {
      const queryPromise = db
        .update(users)
        .set({
          loginAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, validatedId));

      await this.executeWithTimeout(queryPromise, 3000, 'reset login attempts');
    } catch (error) {
      this.sanitizeError(error, 'reset login attempts');
    }
  }

  /**
   * Lock account until specified time
   */
  async lockAccount(id: string, until: Date): Promise<void> {
    const validatedId = this.validateUserId(id);

    if (!until || !(until instanceof Date)) {
      throw new ValidationError('Invalid lock until date');
    }

    try {
      const queryPromise = db
        .update(users)
        .set({
          lockedUntil: until,
          updatedAt: new Date(),
        })
        .where(eq(users.id, validatedId));

      await this.executeWithTimeout(queryPromise, 3000, 'lock account');
    } catch (error) {
      this.sanitizeError(error, 'lock account');
    }
  }

  /**
   * Get user statistics (rate limited)
   */
  async getUserStats(): Promise<{
    total: number;
    verified: number;
    unverified: number;
    googleUsers: number;
    lockedUsers: number;
  }> {
    try {
      // Use aggregation queries for better performance
      const [totalResult, verifiedResult, googleResult, lockedResult] = await Promise.all([
        this.executeWithTimeout(
          db.execute(sql`SELECT COUNT(*) as count FROM users`),
          5000,
          'get total users'
        ),
        this.executeWithTimeout(
          db.execute(sql`SELECT COUNT(*) as count FROM users WHERE is_email_verified = true`),
          5000,
          'get verified users'
        ),
        this.executeWithTimeout(
          db.execute(sql`SELECT COUNT(*) as count FROM users WHERE auth_provider = 'google'`),
          5000,
          'get google users'
        ),
        this.executeWithTimeout(
          db.execute(sql`SELECT COUNT(*) as count FROM users WHERE locked_until > NOW()`),
          5000,
          'get locked users'
        ),
      ]);

      const total = Number(totalResult.rows[0]?.count) || 0;
      const verified = Number(verifiedResult.rows[0]?.count) || 0;
      const googleUsers = Number(googleResult.rows[0]?.count) || 0;
      const lockedUsers = Number(lockedResult.rows[0]?.count) || 0;

      return {
        total,
        verified,
        unverified: total - verified,
        googleUsers,
        lockedUsers,
      };
    } catch (error) {
      this.sanitizeError(error, 'get user statistics');
    }
  }

  /**
   * Bulk update users with transaction
   */
  async bulkUpdate(userIds: string[], data: Partial<User>): Promise<number> {
    // Validate all IDs first
    const validatedIds = userIds.map(id => this.validateUserId(id));

    if (validatedIds.length === 0) {
      return 0;
    }

    // Limit bulk operations
    if (validatedIds.length > 100) {
      throw new ValidationError('Bulk update limited to 100 users at a time');
    }

    // Clean update data
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => 
        value !== undefined && 
        key !== 'id' && 
        key !== 'createdAt'
      )
    );

    if (cleanData.email) {
      cleanData.email = this.validateEmail(cleanData.email as string);
    }

    cleanData.updatedAt = new Date();

    try {
      return await db.transaction(async (tx) => {
        let totalUpdated = 0;

        for (const userId of validatedIds) {
          const result = await tx
            .update(users)
            .set(cleanData)
            .where(eq(users.id, userId))
            .returning({ id: users.id });

          totalUpdated += result.length;
        }

        return totalUpdated;
      });
    } catch (error) {
      this.sanitizeError(error, 'bulk update users');
    }
  }
}