// src/database/schema/tables/profiles.table.ts
import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { subscriptionTierEnum } from '../enums';
import { users } from "./users.table";

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  username: text('username').unique(),
  displayName: text('display_name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  
  // Subscription
  subscriptionTier: subscriptionTierEnum('subscription_tier').notNull().default('free'),
  subscriptionExpiresAt: timestamp('subscription_expires_at', { withTimezone: true }),
  treeCount: integer('tree_count').notNull().default(0),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_profiles_user_id').on(table.userId),
  usernameIdx: index('idx_profiles_username').on(table.username),
}));

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;