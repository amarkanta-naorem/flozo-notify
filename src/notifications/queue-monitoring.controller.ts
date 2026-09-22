import { Controller, Get, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { NOTIFICATION_QUEUE } from '../bullmq/bull-queue.module';

export interface QueueStats {
  queue: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface QueueHealthResponse {
  success: boolean;
  queues: QueueStats[];
  timestamp: string;
}

@Controller('queue')
export class QueueMonitoringController {
  constructor(
    @Inject(NOTIFICATION_QUEUE) private readonly notificationsQueue: Queue,
  ) {}

  @Get('stats')
  async getQueueStats(): Promise<QueueHealthResponse> {
    const queues: QueueStats[] = [];

    for (const queue of [this.notificationsQueue]) {
      const [waiting, active, completed, failed, delayed] =
        await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
        ]);

      queues.push({
        queue: queue.name,
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused: await queue.isPaused(),
      });
    }

    return {
      success: true,
      queues,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  async getQueueHealth(): Promise<QueueHealthResponse> {
    return this.getQueueStats();
  }
}