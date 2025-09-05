import { MESSAGE_CODES, MessageCode } from './message-codes';

export const MESSAGES: Record<MessageCode, string> = {
  // Auth Success
  [MESSAGE_CODES.AUTH_USER_CREATED]: 'User created successfully',
  [MESSAGE_CODES.AUTH_LOGIN_SUCCESS]: 'Login successful',
  [MESSAGE_CODES.AUTH_EMAIL_VERIFIED]: 'Email verified successfully',
  [MESSAGE_CODES.AUTH_PASSWORD_RESET_SENT]:
    'If the email exists, a password reset link has been sent',
  [MESSAGE_CODES.AUTH_PASSWORD_RESET_SUCCESS]: 'Password reset successful',
  [MESSAGE_CODES.AUTH_TOKEN_REFRESHED]: 'Token refreshed successfully',
  [MESSAGE_CODES.AUTH_LOGOUT_SUCCESS]: 'Logout successful',
  [MESSAGE_CODES.AUTH_VERIFICATION_EMAIL_SENT]: 'Verification email sent',
  [MESSAGE_CODES.AUTH_GOOGLE_SUCCESS]: 'Google authentication successful',

  // Auth Errors
  [MESSAGE_CODES.AUTH_INVALID_CREDENTIALS]: 'Invalid credentials',
  [MESSAGE_CODES.AUTH_EMAIL_EXISTS]: 'Email already exists',
  [MESSAGE_CODES.AUTH_ACCOUNT_LOCKED]:
    'Account is temporarily locked due to too many failed login attempts',
  [MESSAGE_CODES.AUTH_EMAIL_NOT_VERIFIED]: 'Email address is not verified',
  [MESSAGE_CODES.AUTH_EMAIL_ALREADY_VERIFIED]: 'Email is already verified',
  [MESSAGE_CODES.AUTH_GOOGLE_ACCOUNT_REQUIRED]:
    'This account was created with Google. Please sign in with Google.',
  [MESSAGE_CODES.AUTH_INVALID_TOKEN]: 'Invalid or expired token',
  [MESSAGE_CODES.AUTH_TOKEN_EXPIRED]: 'Token has expired',
  [MESSAGE_CODES.AUTH_REFRESH_TOKEN_INVALID]: 'Invalid refresh token',
  [MESSAGE_CODES.AUTH_RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [MESSAGE_CODES.AUTH_VERIFICATION_RATE_LIMIT]:
    'Please wait before requesting another verification email',

  // General Errors
  [MESSAGE_CODES.VALIDATION_ERROR]: 'Validation error',
  [MESSAGE_CODES.USER_NOT_FOUND]: 'User not found',
  [MESSAGE_CODES.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [MESSAGE_CODES.NOT_FOUND]: 'Resource not found',
  [MESSAGE_CODES.FORBIDDEN]: 'Access denied',

  // Database Errors
  [MESSAGE_CODES.DB_CONSTRAINT_VIOLATION]: 'Data constraint violation',
  [MESSAGE_CODES.DB_CONNECTION_ERROR]: 'Database connection error',
};
