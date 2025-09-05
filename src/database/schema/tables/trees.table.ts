// src/database/schema/tables/trees.table.ts
import { pgTable, uuid, text, timestamp, integer, decimal, date, boolean, index } from 'drizzle-orm/pg-core';
import { acquisitionSourceEnum } from '../enums';
import { profiles } from './profiles.table';
import { species } from './species.table';
import { folders } from "./folders.table";

export const trees = pgTable('trees', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id')
    .references(() => folders.id, { onDelete: 'set null' }),
  nickname: text('nickname'),
  speciesId: uuid('species_id')
    .notNull()
    .references(() => species.id),
  
  // Acquisition info
  acquiredDate: date('acquired_date').notNull(),
  acquisitionSource: acquisitionSourceEnum('acquisition_source'),
  sourceName: text('source_name'),
  purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }),
  
  // Settings
  isPublic: boolean('is_public').notNull().default(false),
  position: integer('position').notNull().default(0),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_trees_user_id').on(table.userId),
  folderIdIdx: index('idx_trees_folder_id').on(table.folderId),
  speciesIdIdx: index('idx_trees_species_id').on(table.speciesId),
  publicIdx: index('idx_trees_public').on(table.isPublic),
}));

export type Tree = typeof trees.$inferSelect;
export type NewTree = typeof trees.$inferInsert;