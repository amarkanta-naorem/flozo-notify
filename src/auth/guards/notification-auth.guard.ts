import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  userId: number;
  phone: string;
}

@Injectable()
export class NotificationAuthGuard implements CanActivate {
  private readonly logger = new Logger(NotificationAuthGuard.name);
  private readonly accessSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.accessSecret = configService.get<string>('JWT_ACCESS_SECRET') || '';
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required.');
    }

    const token = authHeader.substring(7);

    try {
      const payload = jwt.verify(token, this.accessSecret) as {
        userId: number;
        phone: string;
      };
      request.user = payload;
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Token verification failed: ${message}`);
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}