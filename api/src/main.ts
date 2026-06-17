import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.enableCors({ origin: true, credentials: true });
  // All routes are served under /api (matches the nginx reverse-proxy rule).
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('IDF')
    .setDescription('IDF API description')
    .setVersion('1.0')
    .addTag('IDF')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
