import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from '../firebase/firebase.module';
import { DrizzleModule } from '../db/drizzle.module';
import { BullQueueModule } from '../bullmq/bull-queue.module';
import { AuthModule } from '../auth/auth.module';
import { DeviceTokenService } from './services/device-token.service';
import { NotificationService } from './services/notification.service';
import { BullQueueService } from './services/bull-queue.service';
import { NotificationProcessor } from './processors/notification.processor';
import { DeviceTokensController } from './device-tokens.controller';
import { NotificationsController } from './notifications.controller';
import { QueueMonitoringController } from './queue-monitoring.controller';
import { Worker } from 'bullmq';
import { NOTIFICATION_QUEUE, NOTIFICATION_QUEUE_NAME } from '../bullmq/bull-queue.module';

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
      ) => {
        const worker = new Worker(queueName, processor.process.bind(processor), {
          concurrency: 5,
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        });
        return worker;
      },
      inject: [NOTIFICATION_QUEUE_NAME, NotificationProcessor],
    },
  ],
  controllers: [DeviceTokensController, NotificationsController, QueueMonitoringController],
  exports: [
    DeviceTokenService,
    NotificationService,
    BullQueueService,
    NotificationProcessor,
  ],
})
export class NotificationsModule {}