import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  // Disable contentSecurityPolicy so Swagger UI assets can load on platforms
  // that enforce stricter CSP (e.g. serverless platforms / Vercel)
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(compression());

  // CORS
  app.enableCors({
    origin: true, //process.env.FRONTEND_URL || 'http://localhost:8081',
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Voter Data API')
    .setDescription('API documentation for the Voter Data Management System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerPath = `${globalPrefix}/docs`;
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      url: `/${swaggerPath}-json`,
    },
  });

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
