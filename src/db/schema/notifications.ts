import {
  pgTable,
  bigint,
  varchar,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const notifications = pgTable(
  'notifications',
  {
    id: bigint('id', { mode: 'number' })
      .generatedByDefaultAsIdentity()
      .primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    body: varchar('body', { length: 1024 }),
    data: jsonb('data'),
    type: varchar('type', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    index('notifications_type_idx').on(table.type),
    index('notifications_created_at_idx').on(table.createdAt),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;