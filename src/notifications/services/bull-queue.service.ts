import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  SendToUserDto,
  SendToUsersDto,
  SendToTokenDto,
  SendToTopicDto,
} from '../dto/send-notification.dto';
import { NOTIFICATION_QUEUE } from '../../bullmq/bull-queue.module';

export interface EnqueueResult {
  jobId: string;
}

@Injectable()
export class BullQueueService {
  private readonly logger = new Logger(BullQueueService.name);

  constructor(
    @Inject(NOTIFICATION_QUEUE) private readonly queue: Queue,
  ) {}

  async addSendToUserJob(dto: SendToUserDto): Promise<string> {
    const job = await this.queue.add('send-to-user', {
      jobType: 'send-to-user',
      userId: dto.userId,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      type: dto.type,
      priority: dto.priority,
    });
    this.logger.log(`Enqueued send-to-user job: ${job.id} for user ${dto.userId}`);
    return job.id!;
  }

  async addSendToUsersJob(dto: SendToUsersDto): Promise<string> {
    const job = await this.queue.add('send-to-users', {
      jobType: 'send-to-users',
      userIds: dto.userIds,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      type: dto.type,
      priority: dto.priority,
    });
    this.logger.log(`Enqueued send-to-users job: ${job.id} for ${dto.userIds.length} users`);
    return job.id!;
  }

  async addSendToTokenJob(dto: SendToTokenDto): Promise<string> {
    const job = await this.queue.add('send-to-token', {
      jobType: 'send-to-token',
      token: dto.token,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      type: dto.type,
      priority: dto.priority,
    });
    this.logger.log(`Enqueued send-to-token job: ${job.id}`);
    return job.id!;
  }

  async addSendToTopicJob(dto: SendToTopicDto): Promise<string> {
    const job = await this.queue.add('send-to-topic', {
      jobType: 'send-to-topic',
      topic: dto.topic,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      type: dto.type,
      priority: dto.priority,
    });
    this.logger.log(`Enqueued send-to-topic job: ${job.id} for topic ${dto.topic}`);
    return job.id!;
  }
}