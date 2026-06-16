import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // All HTTP routes live under /api (so the billing routes are /api/billing/...).
  app.setGlobalPrefix('api');
  // Allow the Expo app (web + native dev) to call the API in the hackathon.
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('IDF')
    .setDescription('IDF API description')
    .setVersion('1.0')
    .addTag('IDF')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  // Swagger moved to /docs to free /api for the global route prefix.
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
