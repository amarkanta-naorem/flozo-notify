import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../db/schema/index.js';
import { notifications, notificationLogs } from '../../db/schema/index.js';
import { NotificationJobData } from '../dto/notification-job.dto.js';

export interface NotificationRecord {
  id: number;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject('DB') private db: PostgresJsDatabase<typeof schema>,
  ) {}

  /**
   * Create a notification record and return its id.
   */
  async createNotification(
    data: NotificationJobData,
  ): Promise<NotificationRecord> {
    const [inserted] = await this.db
      .insert(notifications)
      .values({
        title: data.title,
        body: data.body,
        data: data.data ?? {},
        type: data.type,
      })
      .returning();

    return { id: inserted.id };
  }

  /**
   * Record a delivery attempt result.
   */
  async recordDeliveryLog(
    notificationId: number | undefined,
    deviceTokenId: number | undefined,
    status: 'sent' | 'failed' | 'retrying',
    firebaseMessageId?: string,
    error?: string,
  ): Promise<number> {
    const [inserted] = await this.db
      .insert(notificationLogs)
      .values({
        notificationId,
        deviceTokenId,
        status,
        firebaseMessageId,
        error,
        sentAt: status === 'sent' ? new Date() : undefined,
      })
      .returning();

    return inserted.id;
  }
}