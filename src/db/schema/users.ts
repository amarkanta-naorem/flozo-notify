import {
  pgTable,
  bigint,
  varchar,
  timestamp,
  json,
} from 'drizzle-orm/pg-core';

/**
 * Legacy users table schema.
 *
 * This represents the OLD schema before fcm_tokens were migrated to device_tokens.
 * Used only by scripts/migrate-fcm-tokens.ts for one-time data migration.
 * The new application code does NOT use this table.
 */
export const users = pgTable('users', {
  id: bigint('id', { mode: 'number' }).generatedByDefaultAsIdentity().primaryKey(),
  fcmTokens: json('fcm_tokens').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;