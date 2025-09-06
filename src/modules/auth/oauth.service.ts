// src/modules/auth/services/oauth.service.ts

import { OAuth2Client } from 'google-auth-library';
import { logger } from '../../shared/utils/logger';
import type { User } from '../../database/schema';
import { IOAuthService } from './interfaces/oauth.service.interface';
import { GoogleProfile } from './auth.types';
import { IUserRepository } from './interfaces/user.repository.interface';

export class OAuthService implements IOAuthService {
  private googleClient: OAuth2Client;

  constructor(private readonly userRepository: IUserRepository) {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  async processGoogleCode(code: string): Promise<GoogleProfile> {
    try {
      logger.info('OAuthService initialized with:', {
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'NOT SET',
      });

      const { tokens } = await this.googleClient.getToken({
        code: code,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      });
      this.googleClient.setCredentials(tokens);

      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token');
      }

      // Mappa al formato GoogleProfile da auth.types
      return {
        id: payload.sub,
        email: payload.email!,
        name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(), // Campo mancante
        firstName: payload.given_name!,
        lastName: payload.family_name!,
        picture: payload.picture,
        emailVerified: payload.email_verified || false,
      };
    } catch (error) {
      logger.error({ error }, 'Google OAuth failed');
      throw new Error('Google authentication failed');
    }
  }

  async findOrCreateGoogleUser(
    profile: GoogleProfile,
  ): Promise<{ user: User; isNewUser: boolean }> {
    let user = await this.userRepository.findByEmail(profile.email);

    if (!user) {
      user = await this.userRepository.create({
        email: profile.email,
        firstName: profile.firstName!,
        lastName: profile.lastName!,
        authProvider: 'google',
        googleId: profile.id,
        isEmailVerified: profile.emailVerified,
        profileImageUrl: profile.picture,
        onboardingStep: 0,
      });

      return { user, isNewUser: true };
    }

    // Update Google ID if not set
    if (!user.googleId && user.authProvider === 'google') {
      await this.userRepository.update(user.id!, {
        googleId: profile.id,
      });
    }

    return { user, isNewUser: false };
  }
}
