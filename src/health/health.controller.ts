import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  dependencies: {
    database: 'configured' | 'not_configured';
    redis: 'configured' | 'not_configured';
    firebase: 'configured' | 'not_configured';
  };
}

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getHealth(): HealthResponse {
    const databaseUrl = !!this.configService.get<string>('DATABASE_URL');
    const redisHost = !!this.configService.get<string>('REDIS_HOST');
    const firebaseProjectId =
      !!this.configService.get<string>('FIREBASE_PROJECT_ID');

    return {
      status: 'ok',
      service: 'flozo-notify',
      version: '0.0.1',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: databaseUrl ? 'configured' : 'not_configured',
        redis: redisHost ? 'configured' : 'not_configured',
        firebase: firebaseProjectId ? 'configured' : 'not_configured',
      },
    };
  }
}