import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from '../firebase/firebase.module.js';
import { DrizzleModule } from '../db/drizzle.module.js';
import { BullQueueModule } from '../bullmq/bull-queue.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DeviceTokenService } from './services/device-token.service.js';
import { NotificationService } from './services/notification.service.js';
import { BullQueueService } from './services/bull-queue.service.js';
import { NotificationProcessor } from './processors/notification.processor.js';
import { DeviceTokensController } from './device-tokens.controller.js';
import { NotificationsController } from './notifications.controller.js';
import { QueueMonitoringController } from './queue-monitoring.controller.js';
import { Worker } from 'bullmq';
import {
  NOTIFICATION_QUEUE,
  NOTIFICATION_QUEUE_NAME,
} from '../bullmq/bull-queue.module.js';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    FirebaseModule,
    DrizzleModule,
    BullQueueModule,
    AuthModule,
  ],
  providers: [
    DeviceTokenService,
    NotificationService,
    BullQueueService,
    NotificationProcessor,
    {
      provide: 'NOTIFICATION_WORKER',
      useFactory: (
        queueName: string,
        processor: NotificationProcessor,
        configService: ConfigService,
      ) => {
        const worker = new Worker(
          queueName,
          processor.process.bind(processor),
          {
            connection: {
              host: configService.get<string>('REDIS_HOST'),
              port: configService.get<number>('REDIS_PORT'),
              password: configService.get<string>('REDIS_PASSWORD'),
            },
            concurrency: 5,
            removeOnComplete: { count: 1000 },
            removeOnFail: { count: 5000 },
          },
        );
        return worker;
      },
      inject: [NOTIFICATION_QUEUE_NAME, NotificationProcessor, ConfigService],
    },
  ],
  controllers: [
    DeviceTokensController,
    NotificationsController,
    QueueMonitoringController,
  ],
  exports: [
    DeviceTokenService,
    NotificationService,
    BullQueueService,
    NotificationProcessor,
  ],
})
export class NotificationsModule {}