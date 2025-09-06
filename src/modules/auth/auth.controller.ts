// src/modules/auth/auth.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  GoogleCodeRequest,
  AuthenticatedRequest,
} from './auth.types';
import { IAuthService } from './interfaces/auth.interfaces';
import { MESSAGES } from '../../shared/constants/messages';
import { MESSAGE_CODES } from '../../shared/constants/message-codes';

/**
 * Auth Controller - HTTP Layer Only
 * Responsibilities: Request/Response handling, HTTP status codes, validation delegation
 */
export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) {
    const result = await this.authService.registerUser(request.body);

    return reply.status(201).send({
      success: true,
      message: MESSAGES[MESSAGE_CODES.AUTH_USER_CREATED],
      messageCode: MESSAGE_CODES.AUTH_USER_CREATED,
      data: result,
    });
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) {
    const result = await this.authService.loginUser(request.body);

    return reply.send({
      success: true,
      message: MESSAGES[MESSAGE_CODES.AUTH_LOGIN_SUCCESS],
      messageCode: MESSAGE_CODES.AUTH_LOGIN_SUCCESS,
      data: result,
    });
  }

  /**
   * Verify email
   * GET /api/auth/verify-email/:token
   */
  async verifyEmail(request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) {
    await this.authService.verifyEmail(request.params.token);

    return reply.send({
      success: true,
      message: MESSAGES[MESSAGE_CODES.AUTH_EMAIL_VERIFIED],
      messageCode: MESSAGE_CODES.AUTH_EMAIL_VERIFIED,
    });
  }

  /**
   * Forgot password - Always returns success for security
   * POST /api/auth/forgot-password
   */
  async forgotPassword(
    request: FastifyRequest<{ Body: ForgotPasswordRequest }>,
    reply: FastifyReply,
  ) {
    await this.authService.forgotPassword(request.body.email);

    return reply.send({
      success: true,
      message: MESSAGES[MESSAGE_CODES.AUTH_PASSWORD_RESET_SENT],
      messageCode: MESSAGE_CODES.AUTH_PASSWORD_RESET_SENT,
    });
  }

  /**
   * Reset password
   * POST /api/auth/reset-password/:token
   */
  async resetPassword(
    request: FastifyRequest<{ Params: { token: string }; Body: ResetPasswordRequest }>,
    reply: FastifyReply,
  ) {
    await this.authService.resetPassword(request.params.token, request.body.password);

    return reply.send({
      success: true,
      message: MESSAGES[MESSAGE_CODES.AUTH_PASSWORD_RESET_SUCCESS],
      messageCode: MESSAGE_CODES.AUTH_PASSWORD_RESET_SUCCESS,
    });
  }

  /**
   * Refresh token
   * POST /api/auth/refresh
   */
  async refreshToken(request: FastifyRequest<{ Body: RefreshTokenRequest }>, reply: FastifyReply) {
    const result = await this.authService.refreshToken(request.body.refreshToken);

    return reply.send({
      success: true,
      message: MESSAGES[MESSAGE_CODES.AUTH_TOKEN_REFRESHED],
      messageCode: MESSAGE_CODES.AUTH_TOKEN_REFRESHED,
      data: { tokens: result },
    });
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(request: AuthenticatedRequest, reply: FastifyReply) {
    await this.authService.logoutUser(request.user.id);

    return reply.send({
      success: true,
      message: MESSAGES[MESSAGE_CODES.AUTH_LOGOUT_SUCCESS],
      messageCode: MESSAGE_CODES.AUTH_LOGOUT_SUCCESS,
    });
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async getMe(request: AuthenticatedRequest, reply: FastifyReply) {
    const result = await this.authService.getCurrentUser(request.user.id);

    return reply.send({
      success: true,
      data: result,
    });
  }

  /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
  async resendVerification(request: AuthenticatedRequest, reply: FastifyReply) {
    await this.authService.resendVerificationEmail(request.user.id);

    return reply.send({
      success: true,
      message: MESSAGES[MESSAGE_CODES.AUTH_VERIFICATION_EMAIL_SENT],
      messageCode: MESSAGE_CODES.AUTH_VERIFICATION_EMAIL_SENT,
    });
  }

  /**
   * Google OAuth with code
   * POST /api/auth/google/code
   */
  async googleAuthCode(request: FastifyRequest<{ Body: GoogleCodeRequest }>, reply: FastifyReply) {
    const result = await this.authService.authenticateWithGoogle(request.body.code);

    return reply.send({
      success: true,
      message: MESSAGES[MESSAGE_CODES.AUTH_GOOGLE_SUCCESS],
      messageCode: MESSAGE_CODES.AUTH_GOOGLE_SUCCESS,
      data: result,
    });
  }
}
