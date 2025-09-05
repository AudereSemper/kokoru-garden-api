// src/database/schema/tables/photos.table.ts
import { pgTable, uuid, text, timestamp, date, index } from 'drizzle-orm/pg-core';
import { trees } from './trees.table';
import { profiles } from './profiles.table';

export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  treeId: uuid('tree_id')
    .notNull()
    .references(() => trees.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }), // denormalized for RLS
  
  photoUrl: text('photo_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  caption: text('caption'),
  takenAt: date('taken_at').notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  treeIdIdx: index('idx_photos_tree_id').on(table.treeId),
  userIdIdx: index('idx_photos_user_id').on(table.userId),
  takenAtIdx: index('idx_photos_taken_at').on(table.treeId, table.takenAt),
}));

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;