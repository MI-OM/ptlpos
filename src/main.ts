import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.setGlobalPrefix('api');

  // Enable CORS for frontend - Dynamic configuration based on environment
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3000', 'http://127.0.0.1:3000'];

  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  // Dynamic CORS configuration
  const corsConfig = {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    // Additional security for production
    ...(isProduction && {
      maxAge: 86400, // Cache preflight requests for 24 hours in production
      optionsSuccessStatus: 204,
    }),
    // More permissive for development
    ...(isDevelopment && {
      maxAge: 300, // Cache preflight for 5 minutes in development
      optionsSuccessStatus: 200,
    }),
  };

  app.enableCors(corsConfig);

  // Log CORS configuration for debugging
  console.log(`CORS configured for origins: ${corsOrigins.join(', ')}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Setup Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('PTLPOS API')
    .setDescription('Multi-tenant POS and retail SaaS backend API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      displayOperationId: true,
      persistAuthorization: true,
    },
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Swagger UI available at http://localhost:${port}/api/docs`);
}

bootstrap();
