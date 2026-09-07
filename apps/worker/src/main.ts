import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  // A Worker is an application context, not an HTTP server.
  await NestFactory.createApplicationContext(WorkerModule);
  Logger.log('Worker application is ready', 'Bootstrap');
}

void bootstrap();

