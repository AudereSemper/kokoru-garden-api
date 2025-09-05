// src/modules/auth/interfaces/token.service.interface.ts
import { JwtPayload } from '../auth.types';

export interface ITokenService {
  generateAccessToken(payload: JwtPayload): string;
  generateRefreshToken(payload: JwtPayload): string;
  verifyAccessToken(token: string): JwtPayload;
  verifyRefreshToken(token: string): JwtPayload;
  generateRandomToken(): string;
  hashToken(token: string): string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface VerifyResult {
  valid: boolean;
  payload?: TokenPayload;
  reason?: string;
}

export type TokenType = 'access' | 'refresh' | 'email_verification' | 'password_reset';