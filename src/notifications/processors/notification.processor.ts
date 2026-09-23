import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../db/schema/index.js';
import type {
  NotificationJob,
  SendToUserJob,
  SendToUsersJob,
  SendToTokenJob,
  SendToTopicJob,
} from '../dto/notification-job.dto.js';
import { DeviceTokenService } from '../services/device-token.service.js';
import { NotificationService } from '../services/notification.service.js';
import { FcmService } from '../../firebase/services/fcm.service.js';

export interface JobResult {
  success: boolean;
  sent: number;
  failed: number;
  invalidTokens: string[];
  error?: string;
}

@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @Inject('DB') private db: PostgresJsDatabase<typeof schema>,
    private readonly deviceTokenService: DeviceTokenService,
    private readonly notificationService: NotificationService,
    private readonly fcmService: FcmService,
  ) {}

  async process(job: Job<NotificationJob>): Promise<JobResult> {
    const { jobType } = job.data;
    this.logger.log(
      `[Job ${job.id}] Processing ${jobType} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`,
    );

    try {
      switch (jobType) {
        case 'send-to-user':
          return await this.processSendToUser(job as Job<SendToUserJob>);
        case 'send-to-users':
          return await this.processSendToUsers(job as Job<SendToUsersJob>);
        case 'send-to-token':
          return await this.processSendToToken(job as Job<SendToTokenJob>);
        case 'send-to-topic':
          return await this.processSendToTopic(job as Job<SendToTopicJob>);
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }
    } catch (error: any) {
      this.logger.error(
        `[Job ${job.id}] Failed: ${error.message}`,
      );
      throw error;
    }
  }

  private async processSendToUser(job: Job<SendToUserJob>): Promise<JobResult> {
    const { userId, ...notifData } = job.data;
    const tokens = await this.deviceTokenService.getActiveTokensForUser(userId);

    if (tokens.length === 0) {
      this.logger.log(`[Job ${job.id}] No active tokens for user ${userId}`);
      return { success: true, sent: 0, failed: 0, invalidTokens: [] };
    }

    return this.sendToTokens(tokens, notifData, job.id);
  }

  private async processSendToUsers(job: Job<SendToUsersJob>): Promise<JobResult> {
    const { userIds, ...notifData } = job.data;
    const allTokens: string[] = [];

    for (const userId of userIds) {
      const tokens = await this.deviceTokenService.getActiveTokensForUser(userId);
      allTokens.push(...tokens);
    }

    if (allTokens.length === 0) {
      this.logger.log(`[Job ${job.id}] No active tokens for any user`);
      return { success: true, sent: 0, failed: 0, invalidTokens: [] };
    }

    return this.sendToTokens(allTokens, notifData, job.id);
  }

  private async processSendToToken(job: Job<SendToTokenJob>): Promise<JobResult> {
    const { token, ...notifData } = job.data;
    return this.sendToTokens([token], notifData, job.id);
  }

  private async processSendToTopic(job: Job<SendToTopicJob>): Promise<JobResult> {
    const { topic, ...notifData } = job.data;
    try {
      const messageId = await this.fcmService.sendToTopic(
        topic,
        notifData,
        notifData.data,
        { priority: notifData.priority },
      );
      this.logger.log(`[Job ${job.id}] Sent to topic ${topic}: ${messageId}`);
      return { success: true, sent: 1, failed: 0, invalidTokens: [] };
    } catch (error: any) {
      this.logger.error(`[Job ${job.id}] Topic send failed: ${error.message}`);
      throw error;
    }
  }

  private async sendToTokens(
    tokens: string[],
    notifData: { title: string; body: string; data?: Record<string, string>; type?: string; priority: 'high' | 'normal' },
    jobId: string | number | undefined,
  ): Promise<JobResult> {
    const notificationRecord = await this.notificationService.createNotification(notifData);

    const result = await this.fcmService.sendToMultipleDevices(
      tokens,
      notifData,
      notifData.data,
      { priority: notifData.priority },
    );

    for (const failedToken of result.failedTokens) {
      await this.deviceTokenService.markTokenInactive(failedToken.token);
      await this.notificationService.recordDeliveryLog(
        notificationRecord.id,
        undefined,
        'failed',
        undefined,
        failedToken.error,
      );
    }

    const successCount = result.success;
    for (let i = 0; i < successCount; i++) {
      await this.notificationService.recordDeliveryLog(
        notificationRecord.id,
        undefined,
        'sent',
      );
    }

    this.logger.log(
      `[Job ${jobId}] Sent: ${successCount}, Failed: ${result.failed}, Invalid tokens deactivated: ${result.failedTokens.length}`,
    );

    return {
      success: result.failed === 0,
      sent: result.success,
      failed: result.failed,
      invalidTokens: result.failedTokens.map((ft: { token: string }) => ft.token),
    };
  }
}