// src/modules/auth/services/email.service.ts

import { CreateEmailResponse, Resend } from 'resend';
import path from 'path';
import { promises as fs } from 'fs';
import type { Redis } from 'ioredis';
import { logger } from '@/shared/utils/logger';
import {
  EMAIL_ERRORS,
  RESEND_CONFIG,
  EMAIL_CONFIG,
  EMAIL_PATTERNS,
  EMAIL_PRIORITIES,
  EMAIL_STATUS,
} from '@/shared/constants/email.constants';

// Types definiti correttamente
interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  data?: Record<string, string | number>;
  priority?: string;
  attachments?: EmailAttachment[];
  html?: string;
}

interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

interface EmailResponse {
  status: string;
  messageId: string;
  accepted: string[];
  rejected: string[];
}

interface EmailStats {
  daily: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  monthly: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  willResetAt: string;
}

interface RateLimit {
  count: number;
  resetTime: number;
}

interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
}

export interface IEmailService {
  send(options: EmailOptions): Promise<EmailResponse>;
  sendVerificationEmail(user: User, token: string): Promise<void>;
  sendPasswordResetEmail(user: User, token: string): Promise<void>;
  sendWelcomeEmail(user: User): Promise<void>;
  sendPasswordChangedEmail(user: User): Promise<void>;
  sendAccountLockedEmail(user: User, reason: string): Promise<void>;
  getUsageStats(): Promise<EmailStats | null>;
}

export class EmailService implements IEmailService {
  private resend: Resend | null = null;
  private isInitialized = false;
  private templates = new Map<string, string>();
  private rateLimitMap = new Map<string, RateLimit>();
  private redis?: Redis;

  constructor(redis?: Redis) {
    this.redis = redis;
  }

  /**
   * Initialize email service with Resend
   */
  async initialize(): Promise<void> {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is required');
      }

      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.isInitialized = true;
      logger.info('Email service (Resend) initialized successfully');

      await this.loadTemplates();
    } catch (error) {
      logger.error({ error }, 'Failed to initialize email service');
      throw new Error(EMAIL_ERRORS.SERVICE_UNAVAILABLE);
    }
  }

  /**
   * Load email templates
   */
  private async loadTemplates(): Promise<void> {
    try {
      const templatesDir = path.join(__dirname, '../../../templates/emails');
      const templateFiles = await fs.readdir(templatesDir);

      for (const file of templateFiles) {
        if (file.endsWith('.html')) {
          const templateName = file.replace('.html', '');
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          this.templates.set(templateName, templateContent);
        }
      }

      logger.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.warn({ error }, 'Failed to load email templates');
    }
  }

  /**
   * Check daily email limit
   */
  private async checkDailyLimit(): Promise<{ count: number; limit: number; remaining: number }> {
    const limit = Math.floor(RESEND_CONFIG.LIMITS.CUSTOM.DAILY * RESEND_CONFIG.SAFETY_MARGIN);

    if (this.redis) {
      const today = new Date().toISOString().split('T')[0];
      const key = `${RESEND_CONFIG.REDIS_PREFIX}daily:${today}`;

      const count = await this.redis.incr(key);

      if (count === 1) {
        await this.redis.expire(key, 86400);
      }

      if (count > limit) {
        throw new Error(`Daily email limit reached (${count}/${limit})`);
      }

      return { count, limit, remaining: limit - count };
    } else {
      // Database fallback - assumo che hai una tabella email_logs
      const count = 0; // Implementa query al database se necessario
      return { count, limit, remaining: limit - count };
    }
  }

  /**
   * Log email to database
   */
  private async logEmailSent(to: string | string[], subject: string): Promise<void> {
    try {
      const recipient = Array.isArray(to) ? to.join(',') : to;

      logger.info(
        {
          recipient,
          subject,
          timestamp: new Date().toISOString(),
        },
        'Email sent',
      );

      // TODO: Quando aggiungi la tabella email_logs:
      // await db
      //   .insertInto('email_logs')
      //   .values({
      //     recipient,
      //     subject,
      //     template,
      //     message_id: messageId,
      //     sent_date: new Date(),
      //     status: 'sent',
      //   })
      //   .execute();
    } catch (error) {
      logger.error({ error }, 'Failed to log email');
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<EmailStats | null> {
    try {
      const dailyLimit = Math.floor(
        RESEND_CONFIG.LIMITS.CUSTOM.DAILY * RESEND_CONFIG.SAFETY_MARGIN,
      );
      const monthlyLimit = Math.floor(
        RESEND_CONFIG.LIMITS.CUSTOM.MONTHLY * RESEND_CONFIG.SAFETY_MARGIN,
      );

      // Implementa logica per recuperare statistiche dal database
      const daily = 0;
      const monthly = 0;

      return {
        daily: {
          used: daily,
          limit: dailyLimit,
          remaining: Math.max(0, dailyLimit - daily),
          percentage: Math.round((daily / dailyLimit) * 100),
        },
        monthly: {
          used: monthly,
          limit: monthlyLimit,
          remaining: Math.max(0, monthlyLimit - monthly),
          percentage: Math.round((monthly / monthlyLimit) * 100),
        },
        willResetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      };
    } catch (error) {
      logger.error({ error }, 'Error getting usage stats');
      return null;
    }
  }

  /**
   * Check rate limit per user
   */
  private checkRateLimit(email: string): boolean {
    if (process.env.EMAIL_RATE_LIMIT_ENABLED !== 'true') {
      return true;
    }

    const now = Date.now();
    const userLimits = this.rateLimitMap.get(email) || {
      count: 0,
      resetTime: now,
    };

    if (now > userLimits.resetTime) {
      userLimits.count = 0;
      userLimits.resetTime = now + EMAIL_CONFIG.RATE_LIMITS.WINDOW_MS;
    }

    if (userLimits.count >= EMAIL_CONFIG.RATE_LIMITS.MAX_PER_HOUR) {
      throw new Error(EMAIL_ERRORS.RATE_LIMIT_EXCEEDED);
    }

    userLimits.count++;
    this.rateLimitMap.set(email, userLimits);
    return true;
  }

  /**
   * Validate email address
   */
  private validateEmail(email: string): boolean {
    if (!email || !EMAIL_PATTERNS.VALID_EMAIL.test(email)) {
      throw new Error(EMAIL_ERRORS.INVALID_RECIPIENT);
    }

    const domain = email.split('@')[1]!.toLowerCase();
    if (
      EMAIL_PATTERNS.DISPOSABLE_DOMAINS.includes(
        domain as (typeof EMAIL_PATTERNS.DISPOSABLE_DOMAINS)[number],
      )
    ) {
      throw new Error('Disposable email addresses are not allowed');
    }

    return true;
  }

  /**
   * Process template with data
   */
  private processTemplate(template: string, data: Record<string, string | number>): string {
    let processed = template;

    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(data[key]));
    });

    return processed;
  }

  /**
   * Send email - MAIN METHOD
   */
  /**
   * Send email - MAIN METHOD
   */
  async send({
    to,
    subject,
    template,
    data = {},
    priority = EMAIL_PRIORITIES.NORMAL,
    attachments = [],
    html,
  }: EmailOptions): Promise<EmailResponse> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.checkDailyLimit();

      const recipients = Array.isArray(to) ? to : [to];
      recipients.forEach((email) => this.validateEmail(email));
      recipients.forEach((email) => this.checkRateLimit(email));

      let emailHtml = '';
      if (template && this.templates.has(template)) {
        emailHtml = this.processTemplate(this.templates.get(template)!, data);
      } else if (html) {
        emailHtml = html;
      } else {
        throw new Error(EMAIL_ERRORS.TEMPLATE_NOT_FOUND);
      }

      const emailData = {
        from: process.env.EMAIL_FROM || RESEND_CONFIG.DEFAULT_FROM,
        to: recipients,
        subject,
        html: emailHtml,
        headers: {
          'X-Priority': priority === EMAIL_PRIORITIES.HIGH ? '1' : '3',
          'X-Mailer': 'Kokoru',
        },
        ...(process.env.EMAIL_REPLY_TO && { reply_to: process.env.EMAIL_REPLY_TO }),
        ...(attachments.length > 0 && { attachments }),
      };

      // Resend ritorna CreateEmailResponse con { data, error }
      const response: CreateEmailResponse = await this.resend!.emails.send(emailData);

      // Verifica se c'è un errore
      if (response.error) {
        throw new Error(response.error.message);
      }

      const messageId = response.data?.id || '';

      await this.logEmailSent(to, subject);

      logger.info({ id: messageId, to, subject, template }, 'Email sent successfully');

      return {
        status: EMAIL_STATUS.SENT,
        messageId,
        accepted: recipients,
        rejected: [],
      };
    } catch (error) {
      logger.error({ error, to, subject }, 'Failed to send email');
      await this.logEmailSent(to, subject);
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(user: User, token: string): Promise<void> {
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

    await this.send({
      to: user.email,
      subject: '🔐 Verify your Kokoru account',
      template: 'verification',
      data: {
        userName: user.username || user.firstName || 'there',
        verificationUrl,
        expiresIn: '24 hours',
      },
      priority: EMAIL_PRIORITIES.HIGH,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user: User): Promise<void> {
    await this.send({
      to: user.email,
      subject: '🌸 Welcome to Kokoru!',
      template: 'welcome',
      data: {
        userName: user.username || user.firstName || 'there',
        loginUrl: `${process.env.APP_URL}/login`,
        supportEmail: EMAIL_CONFIG.DEFAULTS.REPLY_TO,
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

    await this.send({
      to: user.email,
      subject: '🔑 Reset your Kokoru password',
      template: 'passwordReset',
      data: {
        userName: user.username || user.firstName || 'there',
        resetUrl,
        expiresIn: '1 hour',
      },
      priority: EMAIL_PRIORITIES.HIGH,
    });
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChangedEmail(user: User): Promise<void> {
    await this.send({
      to: user.email,
      subject: '✅ Your password has been changed',
      template: 'passwordChanged',
      data: {
        userName: user.username || user.firstName || 'there',
        changeTime: new Date().toLocaleString(),
        supportEmail: EMAIL_CONFIG.DEFAULTS.REPLY_TO,
      },
      priority: EMAIL_PRIORITIES.HIGH,
    });
  }

  /**
   * Send account locked notification
   */
  async sendAccountLockedEmail(user: User, reason: string): Promise<void> {
    await this.send({
      to: user.email,
      subject: '⚠️ Account security notice',
      template: 'accountLocked',
      data: {
        userName: user.username || user.firstName || 'there',
        reason,
        unlockTime: new Date(Date.now() + 30 * 60 * 1000).toLocaleString(),
        supportEmail: EMAIL_CONFIG.DEFAULTS.REPLY_TO,
      },
      priority: EMAIL_PRIORITIES.HIGH,
    });
  }

  /**
   * Cleanup rate limit map
   */
  cleanupRateLimits(): void {
    const now = Date.now();
    for (const [email, limits] of this.rateLimitMap.entries()) {
      if (now > limits.resetTime) {
        this.rateLimitMap.delete(email);
      }
    }
  }
}
