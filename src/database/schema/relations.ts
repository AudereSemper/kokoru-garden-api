// src/database/schema/relations.ts
import { relations } from 'drizzle-orm';
import { users } from './tables/users.table';
import { profiles } from './tables/profiles.table';
import { folders } from './tables/folders.table';
import { species } from './tables/species.table';
import { trees } from './tables/trees.table';
import { carePreferences } from './tables/care-preferences.table';
import { photos } from './tables/photos.table';

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  folders: many(folders),
  trees: many(trees),
  carePreferences: one(carePreferences, {
    fields: [profiles.id],
    references: [carePreferences.userId],
  }),
  customSpecies: many(species),
  photos: many(photos),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [folders.userId],
    references: [profiles.id],
  }),
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: 'folder_hierarchy',
  }),
  children: many(folders, {
    relationName: 'folder_hierarchy',
  }),
  trees: many(trees),
}));

export const speciesRelations = relations(species, ({ one, many }) => ({
  createdBy: one(profiles, {
    fields: [species.createdBy],
    references: [profiles.id],
  }),
  trees: many(trees),
}));

export const treesRelations = relations(trees, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [trees.userId],
    references: [profiles.id],
  }),
  folder: one(folders, {
    fields: [trees.folderId],
    references: [folders.id],
  }),
  species: one(species, {
    fields: [trees.speciesId],
    references: [species.id],
  }),
  photos: many(photos),
}));

export const carePreferencesRelations = relations(carePreferences, ({ one }) => ({
  profile: one(profiles, {
    fields: [carePreferences.userId],
    references: [profiles.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  tree: one(trees, {
    fields: [photos.treeId],
    references: [trees.id],
  }),
  profile: one(profiles, {
    fields: [photos.userId],
    references: [profiles.id],
  }),
}));
