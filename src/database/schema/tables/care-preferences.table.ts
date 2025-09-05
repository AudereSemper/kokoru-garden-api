// src/database/schema/tables/care-preferences.table.ts
import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { profiles } from './profiles.table';

export const carePreferences = pgTable(
  'care_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    // Tracking preferences
    careTrackingEnabled: boolean('care_tracking_enabled').notNull().default(false),
    wateringScheduleEnabled: boolean('watering_schedule_enabled').notNull().default(false),
    repottingRemindersEnabled: boolean('repotting_reminders_enabled').notNull().default(false),
    seasonalTreatmentsEnabled: boolean('seasonal_treatments_enabled').notNull().default(false),
    customTasksEnabled: boolean('custom_tasks_enabled').notNull().default(false),

    // Profile settings
    publicProfileEnabled: boolean('public_profile_enabled').notNull().default(false),
    profileUsername: text('profile_username').unique(),

    // Tracking
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_care_preferences_user_id').on(table.userId),
    profileUsernameIdx: index('idx_care_preferences_username').on(table.profileUsername),
  }),
);

export type CarePreferences = typeof carePreferences.$inferSelect;
export type NewCarePreferences = typeof carePreferences.$inferInsert;
