import { User } from '../../../database/schema/tables/users.table';

export interface IEmailService {
  sendVerificationEmail(user: User, token: string): Promise<void>;
  sendWelcomeEmail(user: User): Promise<void>;
  sendPasswordResetEmail(user: User, token: string): Promise<void>;
  sendPasswordChangedEmail(user: User): Promise<void>;
}