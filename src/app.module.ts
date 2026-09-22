import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module';
import { DrizzleModule } from './db/drizzle.module';
import { BullQueueModule } from './bullmq/bull-queue.module';
import { AuthModule } from './auth/auth.module';
import { RateLimitModule } from './ratelimit/ratelimit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthController } from './health/health.controller';

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