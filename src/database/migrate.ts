// src/database/migrate.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { logger } from '../shared/utils/logger';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    logger.info('🚀 Running database migrations...');

    await migrate(db, {
      migrationsFolder: './src/database/migrations',
    });

    logger.info('✅ Migrations completed successfully');
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    logger.info('Database connection closed');
    process.exit(0);
  }
}

// Run migrations
runMigrations();
