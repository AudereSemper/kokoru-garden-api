import { User } from "@/database/schema";
import { GoogleProfile } from '../auth.types';

export interface IOAuthService {
  processGoogleCode(code: string): Promise<GoogleProfile>;
  findOrCreateGoogleUser(profile: GoogleProfile): Promise<{
    user: User;
    isNewUser: boolean;
  }>;
}
