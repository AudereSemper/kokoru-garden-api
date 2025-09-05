// src/modules/auth/constants/email.constants.ts

export const EMAIL_CONFIG = {
  SERVICE: {
    RESEND: 'resend',
    GMAIL: 'gmail',
    OUTLOOK: 'outlook',
    SENDGRID: 'sendgrid',
    SMTP: 'smtp',
  },

  DEFAULTS: {
    FROM_NAME: 'Kokoru',
    FROM_EMAIL: process.env.EMAIL_FROM || 'hello@kokoru.app',
    REPLY_TO: process.env.EMAIL_REPLY_TO || 'support@kokoru.app',
  },

  RATE_LIMITS: {
    MAX_PER_HOUR: 10,
    MAX_PER_DAY: 50,
    WINDOW_MS: 3600000, // 1 hour in ms
  },

  TIMEOUTS: {
    CONNECTION: 30000, // 30 seconds
    GREETINGS: 120000, // 2 minutes
    SOCKET: 300000, // 5 minutes
  },
} as const;

export const RESEND_CONFIG = {
  LIMITS: {
    FREE: {
      DAILY: 100,
      MONTHLY: 3000,
    },
    PRO: {
      DAILY: 5000,
      MONTHLY: 50000,
    },
    CUSTOM: {
      DAILY: parseInt(process.env.RESEND_DAILY_LIMIT || '100'),
      MONTHLY: parseInt(process.env.RESEND_MONTHLY_LIMIT || '3000'),
    },
  },
  SAFETY_MARGIN: 0.9,
  DEFAULT_FROM: 'Kokoru <onboarding@resend.dev>',
  MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024,
  REDIS_PREFIX: 'kokoru:email:',
  WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
} as const;

export const EMAIL_TEMPLATES = {
  VERIFICATION: 'verification',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'passwordReset',
  PASSWORD_CHANGED: 'passwordChanged',
  ACCOUNT_LOCKED: 'accountLocked',
  BONSAI_REMINDER: 'bonsaiReminder',
  WEEKLY_SUMMARY: 'weeklySummary',
} as const;

export const EMAIL_PRIORITIES = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
} as const;

export const EMAIL_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  BOUNCED: 'bounced',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  COMPLAINED: 'complained',
} as const;

export const EMAIL_ERRORS = {
  INVALID_RECIPIENT: 'Invalid recipient email address',
  TEMPLATE_NOT_FOUND: 'Email template not found',
  SEND_FAILED: 'Failed to send email',
  RATE_LIMIT_EXCEEDED: 'Email rate limit exceeded',
  INVALID_TEMPLATE_DATA: 'Invalid template data provided',
  SERVICE_UNAVAILABLE: 'Email service temporarily unavailable',
  DOMAIN_BLACKLISTED: 'Email domain not allowed',
  ATTACHMENT_TOO_LARGE: 'Attachment size exceeds limit',
  INVALID_API_KEY: 'Email service configuration error',
} as const;

export const EMAIL_PATTERNS = {
  VALID_EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  DISPOSABLE_DOMAINS: [
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'yopmail.com',
    'temp-mail.org',
    'trashmail.com',
    'sharklasers.com',
    'getnada.com',
  ],
} as const;
