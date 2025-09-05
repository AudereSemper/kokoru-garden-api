// src/database/schema/tables/users.table.ts
import { pgTable, uuid, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core';
import { authProviderEnum } from '../enums';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    password: text('password'), // nullable for OAuth
    authProvider: authProviderEnum('auth_provider').notNull().default('local'),
    googleId: text('google_id').unique(),
    profileImageUrl: text('profile_image_url'),

    // Email verification
    isEmailVerified: boolean('is_email_verified').notNull().default(false),
    emailVerificationToken: text('email_verification_token'),
    emailVerificationExpires: timestamp('email_verification_expires', { withTimezone: true }),

    // Password reset
    passwordResetToken: text('password_reset_token'),
    passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),

    // Security
    refreshToken: text('refresh_token'),
    loginAttempts: integer('login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),

    // Tracking
    hasLoggedIn: boolean('has_logged_in').notNull().default(false),
    hasCompletedOnboarding: boolean('has_completed_onboarding').notNull().default(false),
    onboardingStep: integer('onboarding_step').default(0),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    googleIdIdx: index('idx_users_google_id').on(table.googleId),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
