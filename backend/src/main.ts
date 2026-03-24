import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Serve uploaded files (e.g. query attachments)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // CORS: merge CORS_ORIGIN from env with apex + www production frontends (common prod miss: only one is set).
  const corsOrigin = process.env.CORS_ORIGIN;
  const fromEnv = corsOrigin
    ? corsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const defaultSembuzzFrontends = [
    'https://sembuzz.com',
    'https://www.sembuzz.com',
    'http://sembuzz.com',
    'http://www.sembuzz.com',
  ];
  const origins = [
    ...new Set([
      ...fromEnv,
      ...defaultSembuzzFrontends,
      'http://localhost:5173',
      'http://localhost:3000',
    ]),
  ];
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
