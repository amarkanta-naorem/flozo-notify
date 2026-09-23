import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module.js';
import { DrizzleModule } from './db/drizzle.module.js';
import { BullQueueModule } from './bullmq/bull-queue.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RateLimitModule } from './ratelimit/ratelimit.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FirebaseModule,
    DrizzleModule,
    BullQueueModule.forRoot(),
    AuthModule,
    RateLimitModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}