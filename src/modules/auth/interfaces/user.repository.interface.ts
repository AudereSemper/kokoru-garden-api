import { User, NewUser } from '../../../database/schema/tables/users.table';

export interface IUserRepository {
  // Basic CRUD
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: NewUser): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;

  // Auth specific
  findByEmailVerificationToken(hashedToken: string): Promise<User | null>;
  findByPasswordResetToken(hashedToken: string): Promise<User | null>;
  findByRefreshToken(refreshToken: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;

  // Bulk operations
  incrementLoginAttempts(id: string): Promise<void>;
  resetLoginAttempts(id: string): Promise<void>;
  lockAccount(id: string, until: Date): Promise<void>;
}

