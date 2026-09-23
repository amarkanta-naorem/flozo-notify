/**
 * Data Migration Script: Move fcm_tokens from users table to device_tokens table
 *
 * This script reads existing fcm_tokens from the users table and migrates them
 * to the new device_tokens table. It is idempotent - safe to run multiple times.
 *
 * Usage:
 *   npx tsx scripts/migrate-fcm-tokens.ts
 *
 * Environment variables required:
 *   DATABASE_URL - PostgreSQL connection string
 */

import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { deviceTokens } from '../src/db/schema/device-tokens.js';
import { users } from '../src/db/schema/users.js';
import { eq, sql } from 'drizzle-orm';

interface MigrationResult {
  totalUsers: number;
  usersWithTokens: number;
  totalTokens: number;
  migratedTokens: number;
  skippedTokens: number;
  errors: string[];
}

async function migrateFcmTokens(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalUsers: 0,
    usersWithTokens: 0,
    totalTokens: 0,
    migratedTokens: 0,
    skippedTokens: 0,
    errors: [],
  };

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Get all users with fcm_tokens
    const allUsers = await db
      .select({
        id: users.id,
        fcmTokens: users.fcmTokens,
      })
      .from(users);

    result.totalUsers = allUsers.length;
    console.log(`Found ${result.totalUsers} total users`);

    for (const user of allUsers) {
      const tokens = user.fcmTokens || [];
      if (tokens.length === 0) continue;

      result.usersWithTokens++;
      result.totalTokens += tokens.length;

      for (const token of tokens) {
        try {
          // Check if token already exists in device_tokens
          const [existing] = await db
            .select()
            .from(deviceTokens)
            .where(eq(deviceTokens.token, token));

          if (existing) {
            // Update existing token's user association
            await db
              .update(deviceTokens)
              .set({
                userId: user.id,
                isActive: true,
                updatedAt: new Date(),
              })
              .where(eq(deviceTokens.id, existing.id));
            result.skippedTokens++;
          } else {
            // Insert new device token
            await db.insert(deviceTokens).values({
              userId: user.id,
              token,
              platform: 'unknown', // Platform not stored in old schema
              isActive: true,
            });
            result.migratedTokens++;
          }
        } catch (error: any) {
          result.errors.push(`User ${user.id}, token ${token.substring(0, 20)}...: ${error.message}`);
        }
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total users: ${result.totalUsers}`);
    console.log(`Users with tokens: ${result.usersWithTokens}`);
    console.log(`Total tokens: ${result.totalTokens}`);
    console.log(`Migrated tokens: ${result.migratedTokens}`);
    console.log(`Skipped (already exist): ${result.skippedTokens}`);
    console.log(`Errors: ${result.errors.length}`);
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach((err) => console.log(`  - ${err}`));
    }

    return result;
  } finally {
    await client.end();
  }
}

// Run if called directly
migrateFcmTokens()
  .then((result) => {
    console.log('\nMigration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

export { migrateFcmTokens, type MigrationResult };