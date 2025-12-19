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
  const swaggerPath = `/${globalPrefix}/docs`;
  const swaggerJsonPath = `/${globalPrefix}/docs-json`;

  // Serve a small custom HTML that loads Swagger UI from CDN. This avoids
  // Vercel treating `*.js`/`*.css` under the docs path as static files and
  // returning 404. The HTML will request the OpenAPI JSON from `swaggerJsonPath`.
  const swaggerHtml = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>API Docs</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: '${swaggerJsonPath}',
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            layout: 'StandaloneLayout',
            persistAuthorization: true,
          });
          window.ui = ui;
        };
      </script>
    </body>
  </html>`;

  const httpAdapter = app.getHttpAdapter();

  // OpenAPI JSON endpoint
  httpAdapter.get(swaggerJsonPath, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });

  // Docs UI served as HTML that pulls assets from CDN
  httpAdapter.get(swaggerPath, (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(swaggerHtml);
  });

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
