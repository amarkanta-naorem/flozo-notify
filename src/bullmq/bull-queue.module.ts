import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

export const NOTIFICATION_QUEUE = 'NOTIFICATION_QUEUE';
export const NOTIFICATION_QUEUE_NAME = 'NOTIFICATION_QUEUE_NAME';

@Global()
@Module({})
export class BullQueueModule {
  static forRoot(): DynamicModule {
    return {
      module: BullQueueModule,
      providers: [
        {
          provide: NOTIFICATION_QUEUE_NAME,
          useFactory: (configService: ConfigService) =>
            configService.get<string>('QUEUE_NAME', 'notifications'),
          inject: [ConfigService],
        },
        {
          provide: NOTIFICATION_QUEUE,
          useFactory: (queueName: string, configService: ConfigService) =>
            new Queue(queueName, {
              connection: {
                host: configService.get<string>('REDIS_HOST'),
                port: configService.get<number>('REDIS_PORT'),
                password: configService.get<string>('REDIS_PASSWORD'),
              },
              defaultJobOptions: {
                attempts: 3,
                backoff: {
                  type: 'exponential',
                  delay: 2000,
                },
                removeOnComplete: { count: 1000 },
                removeOnFail: { count: 5000 },
              },
            }),
          inject: [NOTIFICATION_QUEUE_NAME, ConfigService],
        },
      ],
      exports: [NOTIFICATION_QUEUE, NOTIFICATION_QUEUE_NAME],
    };
  }
}