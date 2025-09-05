// src/database/schema/tables/folders.table.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  unique,
  AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { profiles } from './profiles.table';

export const folders = pgTable(
  'folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => folders.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    level: integer('level').notNull().default(1),
    position: integer('position').notNull().default(0),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_folders_user_id').on(table.userId),
    parentIdIdx: index('idx_folders_parent_id').on(table.parentId),
    uniqueNamePerParent: unique().on(table.userId, table.parentId, table.name),
  }),
);

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
