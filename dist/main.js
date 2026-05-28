"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.setGlobalPrefix('api');
    const corsOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
        : ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3000', 'http://127.0.0.1:3000'];
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    const corsConfig = {
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
        ...(isProduction && {
            maxAge: 86400,
            optionsSuccessStatus: 204,
        }),
        ...(isDevelopment && {
            maxAge: 300,
            optionsSuccessStatus: 200,
        }),
    };
    app.enableCors(corsConfig);
    console.log(`CORS configured for origins: ${corsOrigins.join(', ')}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    const config = new swagger_1.DocumentBuilder()
        .setTitle('PTLPOS API')
        .setDescription('Multi-tenant POS and retail SaaS backend API')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
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
//# sourceMappingURL=main.js.map