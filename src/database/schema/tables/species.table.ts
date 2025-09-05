// src/database/schema/tables/species.table.ts
import { pgTable, uuid, text, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { profiles } from './profiles.table';

export const species = pgTable('species', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  latinName: text('latin_name'),
  isCustom: boolean('is_custom').notNull().default(false),
  createdBy: uuid('created_by')
    .references(() => profiles.id, { onDelete: 'set null' }),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nameIdx: index('idx_species_name').on(table.name),
  createdByIdx: index('idx_species_created_by').on(table.createdBy),
  uniqueNamePerUser: unique().on(table.name, table.createdBy),
}));

export type Species = typeof species.$inferSelect;
export type NewSpecies = typeof species.$inferInsert;