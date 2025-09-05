// src/modules/auth/auth.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { IUserRepository } from './interfaces/user.repository.interface';
import { AuthenticationError, AuthorizationError } from '../../shared/errors';
import { MESSAGE_CODES } from "@/shared/constants/message-codes";
import { MESSAGES } from "@/shared/constants/messages";
import { ITokenService } from "./interfaces/token.service.interface";

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role?: string;
      isEmailVerified: boolean;
    };
  }
}

export class AuthMiddleware {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Authentication middleware
   * Verifies JWT token and attaches user to request
   */
  authenticate = async (request: FastifyRequest): Promise<void> => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError(MESSAGES[MESSAGE_CODES.AUTH_INVALID_TOKEN]);
    }

    // Extract token (remove "Bearer ")
    const token = authHeader.substring(7);

    try {
      // Verify token
      const decoded = this.tokenService.verifyAccessToken(token);

      // Find user
      const user = await this.userRepository.findById(decoded.userId);

      if (!user) {
        throw new AuthenticationError(MESSAGES[MESSAGE_CODES.AUTH_INVALID_TOKEN]);
      }

      // Check if account is active (if you have this field)
      // if (!user.isActive) {
      //   throw new AuthorizationError('Account is deactivated');
      // }

      // Attach user to request
      request.user = {
        id: user.id!,
        email: user.email!,
        isEmailVerified: user.isEmailVerified!,
        // role: user.role, // if you have roles
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new AuthenticationError(MESSAGES[MESSAGE_CODES.AUTH_TOKEN_EXPIRED]);
        }

        if (error.name === 'JsonWebTokenError') {
          throw new AuthenticationError(MESSAGES[MESSAGE_CODES.AUTH_INVALID_TOKEN]);
        }
      }

      throw error;
    }
  };

  /**
   * Optional authentication middleware
   * Attaches user if valid token exists, otherwise continues
   */
  optionalAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return;
    }

    try {
      const token = authHeader.substring(7);
      const decoded = this.tokenService.verifyAccessToken(token);

      const user = await this.userRepository.findById(decoded.userId);

      if (user) {
        request.user = {
          id: user.id!,
          email: user.email!,
          isEmailVerified: user.isEmailVerified!,
          // role: user.role,
        };
      }
    } catch (error) {
      // Ignore errors and continue without user
    }
  };

  /**
   * Email verification middleware
   * Ensures user has verified their email
   */
  requireEmailVerification = async (
    request: FastifyRequest,
  ): Promise<void> => {
    if (!request.user) {
      throw new AuthenticationError(MESSAGES[MESSAGE_CODES.AUTH_INVALID_TOKEN]);
    }

    if (!request.user.isEmailVerified) {
      throw new AuthorizationError(MESSAGES[MESSAGE_CODES.AUTH_EMAIL_NOT_VERIFIED]);
    }
  };

  /**
   * Role-based access control
   * @param roles - Allowed roles
   */
  authorize = (...roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      if (!request.user) {
        throw new AuthenticationError(MESSAGES[MESSAGE_CODES.AUTH_INVALID_TOKEN]);
      }

      if (!request.user.role || !roles.includes(request.user.role)) {
        throw new AuthorizationError(MESSAGES[MESSAGE_CODES.FORBIDDEN]);
      }
    };
  };

  /**
   * Ensure user is authenticated (shorthand)
   */
  requireAuth = this.authenticate;
}

// Factory function for creating middleware instance
export function createAuthMiddleware(
  tokenService: ITokenService,
  userRepository: IUserRepository,
): AuthMiddleware {
  return new AuthMiddleware(tokenService, userRepository);
}
