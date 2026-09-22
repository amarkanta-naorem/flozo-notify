import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationAuthGuard } from './guards/notification-auth.guard';

@Module({
  imports: [ConfigModule],
  providers: [NotificationAuthGuard],
  exports: [NotificationAuthGuard],
})
export class AuthModule {}