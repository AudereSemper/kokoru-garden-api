// test-connection.ts - Salva nella root del progetto
import { db } from './src/database/connection';
import { species } from './src/database/schema';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

async function testConnection() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('Testing connection...');

  try {
    // Test 1: Simple query
    const result = await db.select().from(species).limit(1);
    console.log('Query successful, species count:', result.length);

    // Test 2: Insert test
    const testSpecies = { name: 'Test Species', latinName: 'Testus testus' };
    const inserted = await db.insert(species).values(testSpecies).returning();
    console.log('Insert successful:', inserted[0]);

    // Test 3: Delete test data
    // Use the eq function from your query builder (e.g., Drizzle ORM)
    await db.delete(species).where(eq(species.name, 'Test Species'));
    console.log('Cleanup successful');

    console.log('All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
  }
}

testConnection();
