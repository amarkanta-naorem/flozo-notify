import {
  pgTable,
  bigint,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const deviceTokens = pgTable(
  'device_tokens',
  {
    id: bigint('id', { mode: 'number' })
      .generatedByDefaultAsIdentity()
      .primaryKey(),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    token: varchar('token', { length: 512 }).notNull(),
    platform: varchar('platform', { length: 20 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('device_tokens_token_unique').on(table.token),
    index('device_tokens_user_id_idx').on(table.userId),
    index('device_tokens_active_idx').on(table.isActive),
  ],
);

export type DeviceToken = typeof deviceTokens.$inferSelect;
export type NewDeviceToken = typeof deviceTokens.$inferInsert;