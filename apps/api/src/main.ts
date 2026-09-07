import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger is initialized at the edge so future feature modules appear automatically.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Knowledge Base API')
    .setDescription('HTTP API for the AI knowledge base management demo')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
