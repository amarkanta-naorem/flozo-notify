import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema/index.js';

@Global()
@Module({
  providers: [
    {
      provide: 'DB',
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        if (!connectionString) {
          throw new Error('DATABASE_URL is not set');
        }

        const connectionStringWithTZ = connectionString.includes('?')
          ? `${connectionString}&options=-c%20TimeZone%3DUTC`
          : `${connectionString}?options=-c%20TimeZone%3DUTC`;

        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isProduction = nodeEnv === 'production';
        const useSSL =
          configService.get<boolean>('DATABASE_SSL') ?? isProduction;

        const client = postgres(connectionStringWithTZ, {
          max: isProduction ? 20 : 5,
          idle_timeout: 20,
          connect_timeout: 10,
          ssl: useSSL ? { rejectUnauthorized: false } : false,
        });

        return drizzle(client, { schema });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DB'],
})
export class DrizzleModule {}