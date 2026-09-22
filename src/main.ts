import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 5005;

  await app.listen(port, '0.0.0.0');
  console.log(`flozo-notify is running on: ${await app.getUrl()}`);
}
await bootstrap();