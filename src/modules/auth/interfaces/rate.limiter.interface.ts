export interface IRateLimiter {
  checkLoginAttempts(userId: string): Promise<{
    canAttempt: boolean;
    attemptsRemaining: number;
    lockedUntil?: Date;
  }>;

  checkEmailResend(userId: string): Promise<{
    canResend: boolean;
    nextAllowedAt?: Date;
  }>;

  recordFailedLogin(userId: string): Promise<void>;
  resetLoginAttempts(userId: string): Promise<void>;
}
