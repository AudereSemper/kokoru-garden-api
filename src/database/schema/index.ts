// src/database/schema/index.ts
// Clean aggregator file - exports everything from submodules

// Export enums
export * from './enums';

// Export tables and types
export * from './tables/users.table';
export * from './tables/profiles.table';
export * from './tables/folders.table';
export * from './tables/species.table';
export * from './tables/trees.table';
export * from './tables/care-preferences.table';
export * from './tables/photos.table';

// Export relations
export * from './relations';
