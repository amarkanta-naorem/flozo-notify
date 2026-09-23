import { Injectable, Logger } from '@nestjs/common';
import { FirebaseError } from 'firebase-admin';
import {
  Message,
  MulticastMessage,
  getMessaging,
} from 'firebase-admin/messaging';
import { FirebaseAdminService } from '../firebase-admin.service.js';

export interface FcmNotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
}

export interface FcmDataPayload {
  [key: string]: string;
}

export interface FcmOptions {
  priority?: 'high' | 'normal';
  ttl?: number;
  collapseKey?: string;
}

export interface FcmSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface FcmBatchSendResult {
  success: number;
  failed: number;
  errors?: string[];
}

export interface FcmErrorInfo {
  index: number;
  token: string;
  error: string;
}

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  /**
   * Send a push notification to a single device token.
   * Returns the Firebase message ID on success.
   * Throws an error on failure so the BullMQ worker can decide on retry.
   */
  async sendNotification(
    deviceToken: string,
    notification: FcmNotificationPayload,
    data?: FcmDataPayload,
    options?: FcmOptions,
  ): Promise<string> {
    const messaging = this.firebaseAdminService.getMessaging();

    const message: Message = {
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: options?.priority || 'high',
        ttl: options?.ttl ? options.ttl * 1000 : 24 * 60 * 60 * 1000,
        collapseKey: options?.collapseKey,
        notification: {
          channelId: 'chat_messages',
          priority: 'high',
          visibility: 'public',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            'content-available': 1,
            sound: 'default',
            alert: {
              title: notification.title,
              body: notification.body,
            },
          },
        },
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'background',
        },
      },
    };

    const response = await messaging.send(message);
    this.logger.log(
      `Notification sent successfully. Message ID: ${response}`,
    );
    return response;
  }

  /**
   * Send push notifications to multiple devices.
   * Returns per-token results so invalid tokens can be identified.
   */
  async sendToMultipleDevices(
    deviceTokens: string[],
    notification: FcmNotificationPayload,
    data?: FcmDataPayload,
    options?: FcmOptions,
  ): Promise<FcmBatchSendResult & { failedTokens: FcmErrorInfo[] }> {
    if (deviceTokens.length === 0) {
      return { success: 0, failed: 0, failedTokens: [] };
    }

    const messaging = this.firebaseAdminService.getMessaging();

    const message: MulticastMessage = {
      tokens: deviceTokens,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: options?.priority || 'high',
        ttl: options?.ttl ? options.ttl * 1000 : 24 * 60 * 60 * 1000,
        collapseKey: options?.collapseKey,
        notification: {
          channelId: 'chat_messages',
          priority: 'high',
          visibility: 'public',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            'content-available': 1,
            sound: 'default',
            alert: {
              title: notification.title,
              body: notification.body,
            },
          },
        },
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'background',
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);

    const failedTokens: FcmErrorInfo[] = [];
    response.responses.forEach(
      (result: { success: boolean; error?: { message?: string } }, index: number) => {
        if (!result.success) {
          failedTokens.push({
            index,
            token: deviceTokens[index],
            error: result.error?.message || 'Unknown error',
          });
        }
      },
    );

    this.logger.log(
      `Batch notification sent. Success: ${response.successCount}, Failed: ${response.failureCount}`,
    );

    return {
      success: response.successCount,
      failed: response.failureCount,
      failedTokens,
    };
  }

  /**
   * Send a notification to a topic.
   */
  async sendToTopic(
    topic: string,
    notification: FcmNotificationPayload,
    data?: FcmDataPayload,
    options?: FcmOptions,
  ): Promise<string> {
    const messaging = this.firebaseAdminService.getMessaging();

    const message: Message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: options?.priority || 'high',
        ttl: options?.ttl ? options.ttl * 1000 : 24 * 60 * 60 * 1000,
        collapseKey: options?.collapseKey,
        notification: {
          channelId: 'chat_messages',
          priority: 'high',
          visibility: 'public',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            'content-available': 1,
            alert: {
              title: notification.title,
              body: notification.body,
            },
          },
        },
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'background',
        },
      },
    };

    const response = await messaging.send(message);
    this.logger.log(
      `Notification sent to topic ${topic}. Message ID: ${response}`,
    );
    return response;
  }

  /**
   * Determine if a Firebase error is transient (should retry) or permanent.
   */
  isTransientError(error: FirebaseError): boolean {
    const code = error.code;
    const transientCodes = [
      'internal',
      'deadline-exceeded',
      'unavailable',
      'resource-exhausted',
      'aborted',
      'cancelled',
      'unknown',
    ];
    return transientCodes.includes(code);
  }

  /**
   * Determine if a token is invalid/unregistered (should NOT retry).
   */
  isInvalidTokenError(error: FirebaseError): boolean {
    const code = error.code;
    const invalidTokenCodes = [
      'invalid-argument',
      'registration-token-not-registered',
      'invalid-recipient',
      'sender-id-mismatch',
    ];
    return invalidTokenCodes.includes(code);
  }
}