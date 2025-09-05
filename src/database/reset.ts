// src/database/reset.ts
import { Pool } from 'pg';
import { logger } from '../shared/utils/logger';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

async function resetDatabase() {
  const dbName = process.env.DB_NAME || 'bonsaitracker';

  // Connect to postgres database (not the target database)
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'bonsai_user',
    password: process.env.DB_PASSWORD || 'bonsai_pass',
    database: 'postgres', // Connect to default postgres database
  });

  try {
    logger.warn('WARNING: Resetting database - ALL DATA WILL BE LOST!');

    // Terminate existing connections
    await pool.query(
      `
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = $1 AND pid <> pg_backend_pid()
    `,
      [dbName],
    );

    // Drop and recreate database
    await pool.query(`DROP DATABASE IF EXISTS ${dbName}`);
    logger.info(`Dropped database: ${dbName}`);

    await pool.query(`CREATE DATABASE ${dbName}`);
    logger.info(`Created database: ${dbName}`);

    await pool.end();

    // Run migrations
    logger.info('Running migrations...');
    execSync('pnpm db:migrate', { stdio: 'inherit' });

    // Run seed if in development
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Seeding database...');
      execSync('pnpm db:seed', { stdio: 'inherit' });
    }

    logger.info('Database reset completed successfully!');
  } catch (error) {
    logger.error('Database reset failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Confirm before reset
if (process.env.NODE_ENV === 'production') {
  logger.error('❌ Cannot reset database in production!');
  process.exit(1);
}

// Run reset
resetDatabase();
