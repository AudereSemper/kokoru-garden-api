// src/modules/auth/services/oauth.service.ts

import { OAuth2Client } from 'google-auth-library';
import { logger } from '../../shared/utils/logger';
import type { User } from '../../database/schema';
import { IOAuthService } from './interfaces/oauth.service.interface';
import { GoogleProfile } from './auth.types';
import { IUserRepository } from './interfaces/user.repository.interface';

export class OAuthService implements IOAuthService {
  googleClient: OAuth2Client;

  constructor(private readonly userRepository: IUserRepository) {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  async processGoogleCode(code: string): Promise<GoogleProfile> {
    try {
      const params = new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: 'https://kokoru-garden.pages.dev/auth/callback',
        grant_type: 'authorization_code',
      });

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Token exchange failed:', data);
        throw new Error(data.error_description || 'Token exchange failed');
      }

      // Ora verifica l'ID token
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: data.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token');
      }

      return {
        id: payload.sub,
        email: payload.email!,
        name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        picture: payload.picture,
        emailVerified: payload.email_verified || false,
      };
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: string } };
      console.error('Google OAuth failed - FULL ERROR:', error);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response?.data);
      logger.error('Google OAuth failed:', {
        message: err.message,
        response: err.response?.data,
      });
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
