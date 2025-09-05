// src/modules/auth/auth.routes.ts
import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
// import { AuthMiddleware } from './auth.middleware';
import { authSchemas } from './auth.schemas';

export async function authRoutes(
  fastify: FastifyInstance,
  controller: AuthController,
//   middleware: AuthMiddleware
) {
  // =============================================================================
  // 🌍 PUBLIC ROUTES
  // =============================================================================

  // Register
  fastify.post('/register', {
    schema: authSchemas.register,
    handler: controller.register
  });

  // Login
  fastify.post('/login', {
    schema: authSchemas.login,
    handler: controller.login
  });

  // Verify email
  fastify.get('/verify-email/:token', {
    schema: authSchemas.verifyEmail,
    handler: controller.verifyEmail
  });

  // Forgot password
  fastify.post('/forgot-password', {
    schema: authSchemas.forgotPassword,
    handler: controller.forgotPassword
  });

  // Reset password
  fastify.post('/reset-password/:token', {
    schema: authSchemas.resetPassword,
    handler: controller.resetPassword
  });

  // Refresh token
  fastify.post('/refresh', {
    schema: authSchemas.refreshToken,
    handler: controller.refreshToken
  });

  // Google OAuth with code
  fastify.post('/google/code', {
    schema: authSchemas.googleAuth,
    handler: controller.googleAuthCode
  });

  // =============================================================================
  // 🔒 PROTECTED ROUTES (require authentication)
  // =============================================================================

  // Logout TO IMPLEMENT
//   fastify.post('/logout', {
//     preHandler: middleware.authenticate,
//     schema: authSchemas.logout,
//     handler: controller.logout
//   });

//   // Get current user
//   fastify.get('/me', {
//     preHandler: middleware.authenticate,
//     schema: authSchemas.getMe,
//     handler: controller.getMe
//   });

//   // Resend verification email
//   fastify.post('/resend-verification', {
//     preHandler: middleware.authenticate,
//     schema: authSchemas.resendVerification,
//     handler: controller.resendVerification
//   });
}

// Alternative plugin-style registration
export async function authRoutesPlugin(fastify: FastifyInstance) {
  // This would be used if dependencies are injected differently
  // For now, just register the route structure
  
  await fastify.register(async function authPlugin(fastify) {
    // Dependencies would be resolved here
    // const controller = resolve<AuthController>('AuthController');
    // const middleware = resolve<AuthMiddleware>('AuthMiddleware');
    
    // await authRoutes(fastify, controller, middleware);
  }, { prefix: '/api/auth' });
}