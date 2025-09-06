// src/database/seed.ts
import { db } from './connection';
import { users, species, profiles } from './schema';
import { logger } from '../shared/utils/logger';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { DEFAULT_SPECIES } from './data/species.data';

dotenv.config();

/**
 * Seeds the database with initial data
 * - Species: Default bonsai species for all users
 * - Test User: Development-only test account
 */
async function seed() {
  try {
    logger.info('Starting database seeding...');

    // Seed species
    await seedSpecies();

    // Seed test user in development
    if (process.env.NODE_ENV === 'development') {
      await seedTestUser();
    }

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

/**
 * Seeds default bonsai species
 */
async function seedSpecies() {
  try {
    const insertedSpecies = await db
      .insert(species)
      .values(DEFAULT_SPECIES)
      .onConflictDoNothing()
      .returning();

    logger.info(
      `Inserted ${insertedSpecies.length} species (${DEFAULT_SPECIES.length} total in database)`,
    );
  } catch (error) {
    logger.error('Failed to seed species:', error);
    throw error;
  }
}

/**
 * Seeds test user for development environment
 */
async function seedTestUser() {
  const TEST_EMAIL = 'test@kokoru-garden.com';
  const TEST_PASSWORD = 'Test123!';

  try {
    // Check if test user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, TEST_EMAIL))
      .limit(1);

    if (existingUser) {
      logger.info('Test user already exists, skipping...');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    // Create test user
    const [testUser] = await db
      .insert(users)
      .values({
        email: TEST_EMAIL,
        firstName: 'Test',
        lastName: 'User',
        password: hashedPassword,
        isEmailVerified: true,
        hasLoggedIn: true,
        hasCompletedOnboarding: true,
      })
      .returning();

    logger.info(`Created test user: ${TEST_EMAIL}`);

    // Create profile for test user
    await db.insert(profiles).values({
      userId: testUser!.id,
      username: 'testuser',
      displayName: 'Test User',
      bio: 'This is a test account for development',
      subscriptionTier: 'pro', // Pro tier for testing all features
      treeCount: 0,
    });

    logger.info('Created test user profile with pro subscription');
    logger.info(`\nTest Credentials:\n  Email: ${TEST_EMAIL}\n  Password: ${TEST_PASSWORD}\n`);
  } catch (error) {
    logger.error('Failed to seed test user:', error);
    throw error;
  }
}

// Execute seeding if run directly
if (require.main === module) {
  seed();
}
