import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BullQueueService } from './services/bull-queue.service.js';
import type {
  SendToUserDto,
  SendToUsersDto,
  SendToTokenDto,
  SendToTopicDto,
} from './dto/send-notification.dto.js';

export interface NotificationResponse {
  success: boolean;
  jobId?: string;
  message: string;
}

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly bullQueueService: BullQueueService) {}

  @Post('send-to-user')
  async sendToUser(@Body() dto: SendToUserDto): Promise<NotificationResponse> {
    try {
      const jobId = await this.bullQueueService.addSendToUserJob(dto);
      return {
        success: true,
        jobId,
        message: 'Notification job enqueued',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to enqueue send-to-user: ${message}`);
      throw new HttpException(
        'Failed to enqueue notification job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send-to-users')
  async sendToUsers(@Body() dto: SendToUsersDto): Promise<NotificationResponse> {
    try {
      const jobId = await this.bullQueueService.addSendToUsersJob(dto);
      return {
        success: true,
        jobId,
        message: 'Notification job enqueued',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to enqueue send-to-users: ${message}`);
      throw new HttpException(
        'Failed to enqueue notification job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send-to-token')
  async sendToToken(@Body() dto: SendToTokenDto): Promise<NotificationResponse> {
    try {
      const jobId = await this.bullQueueService.addSendToTokenJob(dto);
      return {
        success: true,
        jobId,
        message: 'Notification job enqueued',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to enqueue send-to-token: ${message}`);
      throw new HttpException(
        'Failed to enqueue notification job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send-to-topic')
  async sendToTopic(@Body() dto: SendToTopicDto): Promise<NotificationResponse> {
    try {
      const jobId = await this.bullQueueService.addSendToTopicJob(dto);
      return {
        success: true,
        jobId,
        message: 'Notification job enqueued',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to enqueue send-to-topic: ${message}`);
      throw new HttpException(
        'Failed to enqueue notification job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}