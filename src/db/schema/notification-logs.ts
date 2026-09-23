import {
  pgTable,
  bigint,
  varchar,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { deviceTokens } from './device-tokens.js';
import { notifications } from './notifications.js';

export const notificationLogs = pgTable(
  'notification_logs',
  {
    id: bigint('id', { mode: 'number' })
      .generatedByDefaultAsIdentity()
      .primaryKey(),
    notificationId: bigint('notification_id', { mode: 'number' }).references(
      () => notifications.id,
      { onDelete: 'cascade' },
    ),
    deviceTokenId: bigint('device_token_id', { mode: 'number' }).references(
      () => deviceTokens.id,
      { onDelete: 'set null' },
    ),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    firebaseMessageId: varchar('firebase_message_id', { length: 255 }),
    error: varchar('error', { length: 1024 }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('notification_logs_notification_id_idx').on(table.notificationId),
    index('notification_logs_device_token_id_idx').on(
      table.deviceTokenId,
    ),
    index('notification_logs_status_idx').on(table.status),
    index('notification_logs_created_at_idx').on(table.createdAt),
  ],
);

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;