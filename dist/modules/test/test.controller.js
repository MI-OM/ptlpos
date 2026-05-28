"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const email_service_1 = require("../email/email.service");
const supabase_storage_service_1 = require("../products/services/supabase-storage.service");
const config_1 = require("@nestjs/config");
const public_decorator_1 = require("../../core/decorators/public.decorator");
let TestController = class TestController {
    configService;
    emailService;
    storageService = null;
    constructor(configService) {
        this.configService = configService;
        this.emailService = new email_service_1.EmailService(configService);
        const supabaseConfig = this.getSupabaseConfig();
        if (supabaseConfig) {
            this.storageService = new supabase_storage_service_1.SupabaseStorageService(supabaseConfig);
        }
    }
    getSupabaseConfig() {
        const url = this.configService.get('SUPABASE_URL');
        const serviceKey = this.configService.get('SUPABASE_KEY');
        const bucket = this.configService.get('SUPABASE_STORAGE_BUCKET') || 'product-images';
        if (url && serviceKey) {
            return {
                url,
                serviceKey,
                bucket,
                public: true,
                allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
                maxSize: 5242880,
            };
        }
        return null;
    }
    async testWelcomeEmail(body) {
        const { email, name = 'Test User' } = body;
        try {
            const success = await this.emailService.sendWelcomeEmail(email, name, 'http://localhost:3001/login');
            return {
                success,
                message: success
                    ? 'Welcome email sent successfully'
                    : 'Failed to send welcome email',
                emailService: 'Mailgun API',
                recipient: email,
                testName: 'Welcome Email',
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Exception occurred while sending welcome email',
                emailService: 'Mailgun API',
                error: error instanceof Error ? error.message : String(error),
                recipient: email,
                testName: 'Welcome Email',
                timestamp: new Date().toISOString()
            };
        }
    }
    async testPasswordResetEmail(body) {
        const { email, name = 'Test User' } = body;
        const resetToken = 'test-reset-token-' + Date.now();
        const resetUrl = `http://localhost:3001/reset-password?token=${resetToken}`;
        try {
            const success = await this.emailService.sendPasswordResetEmail(email, name, resetToken, resetUrl);
            return {
                success,
                message: success
                    ? 'Password reset email sent successfully'
                    : 'Failed to send password reset email',
                emailService: 'Mailgun API',
                recipient: email,
                testName: 'Password Reset Email',
                resetUrl,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Exception occurred while sending password reset email',
                emailService: 'Mailgun API',
                error: error instanceof Error ? error.message : String(error),
                recipient: email,
                testName: 'Password Reset Email',
                timestamp: new Date().toISOString()
            };
        }
    }
    async testStorageUpload(file) {
        if (!file) {
            return {
                success: false,
                message: 'No file provided',
                storageService: 'Supabase Storage',
                timestamp: new Date().toISOString()
            };
        }
        if (!this.storageService) {
            return {
                success: false,
                message: 'Supabase storage not configured. Check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.',
                storageService: 'Supabase Storage',
                config: {
                    url: this.configService.get('SUPABASE_URL') ? 'SET' : 'NOT_SET',
                    serviceKey: this.configService.get('SUPABASE_SERVICE_KEY') ? 'SET' : 'NOT_SET',
                    bucket: this.configService.get('SUPABASE_STORAGE_BUCKET') || 'product-images'
                },
                timestamp: new Date().toISOString()
            };
        }
        try {
            const productId = 'test-product-' + Date.now();
            const result = await this.storageService.uploadProductImage(productId, file);
            return {
                success: result.success,
                message: result.success ? 'File uploaded successfully' : 'Upload failed',
                storageService: 'Supabase Storage',
                imageUrl: result.imageUrl,
                metadata: result.metadata,
                productId,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Exception occurred during file upload',
                storageService: 'Supabase Storage',
                error: error instanceof Error ? error.message : String(error),
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                timestamp: new Date().toISOString()
            };
        }
    }
    async getServicesStatus() {
        const emailConfigured = this.emailService.isEmailConfigured();
        const storageConfigured = !!this.getSupabaseConfig();
        return {
            email: {
                configured: emailConfigured,
                service: emailConfigured ? 'Mailgun API' : 'Not configured',
                environment: {
                    mailgunDomain: process.env.MAILGUN_DOMAIN ? 'SET' : 'NOT_SET',
                    mailgunApiKey: process.env.MAILGUN_API_KEY ? 'SET' : 'NOT_SET',
                    mailgunFromEmail: process.env.MAILGUN_FROM_EMAIL ? 'SET' : 'NOT_SET'
                }
            },
            storage: {
                configured: storageConfigured,
                service: storageConfigured ? 'Supabase Storage' : 'Not configured',
                environment: {
                    supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
                    supabaseServiceKey: process.env.SUPABASE_KEY ? 'SET' : 'NOT_SET',
                    supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET || 'product-images'
                }
            },
            timestamp: new Date().toISOString()
        };
    }
    async fullIntegrationTest(body) {
        const { email, name = 'Test User' } = body;
        const results = {
            email: {
                welcome: { success: false, message: '', error: null },
                passwordReset: { success: false, message: '', error: null }
            },
            storage: {
                configured: !!this.storageService,
                message: this.storageService ? 'Available for testing' : 'Not configured'
            },
            overall: {
                allServicesWorking: false,
                summary: ''
            }
        };
        try {
            const success = await this.emailService.sendWelcomeEmail(email, name, 'http://localhost:3001/login');
            results.email.welcome.success = success;
            results.email.welcome.message = success ? 'Welcome email sent' : 'Failed to send welcome email';
        }
        catch (error) {
            results.email.welcome.error = error instanceof Error ? error.message : String(error);
        }
        try {
            const resetToken = 'test-token-' + Date.now();
            const resetUrl = `http://localhost:3001/reset-password?token=${resetToken}`;
            const success = await this.emailService.sendPasswordResetEmail(email, name, resetToken, resetUrl);
            results.email.passwordReset.success = success;
            results.email.passwordReset.message = success ? 'Password reset email sent' : 'Failed to send password reset email';
        }
        catch (error) {
            results.email.passwordReset.error = error instanceof Error ? error.message : String(error);
        }
        const emailWorking = results.email.welcome.success || results.email.passwordReset.success;
        const storageWorking = results.storage.configured;
        results.overall.allServicesWorking = emailWorking && storageWorking;
        results.overall.summary = results.overall.allServicesWorking
            ? 'All services are working correctly'
            : `Email: ${emailWorking ? '✅ Working' : '❌ Issues'}, Storage: ${storageWorking ? '✅ Configured' : '❌ Not configured'}`;
        return {
            ...results,
            timestamp: new Date().toISOString(),
            testEmail: email
        };
    }
};
exports.TestController = TestController;
__decorate([
    (0, common_1.Post)('email-welcome'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Test welcome email',
        description: 'Tests the welcome email functionality that would be sent to new users'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Welcome email test result',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                emailService: { type: 'string' }
            }
        }
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "testWelcomeEmail", null);
__decorate([
    (0, common_1.Post)('email-password-reset'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Test password reset email',
        description: 'Tests the password reset email functionality'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Password reset email test result',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
            }
        }
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "testPasswordResetEmail", null);
__decorate([
    (0, common_1.Post)('storage-upload'),
    (0, public_decorator_1.Public)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Test Supabase storage upload',
        description: 'Tests uploading a file to Supabase storage'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Storage upload test result',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                imageUrl: { type: 'string' }
            }
        }
    }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "testStorageUpload", null);
__decorate([
    (0, common_1.Get)('services-status'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Check all external services status',
        description: 'Returns the status of email and storage services'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Services status',
        schema: {
            type: 'object',
            properties: {
                email: {
                    type: 'object',
                    properties: {
                        configured: { type: 'boolean' },
                        service: { type: 'string' }
                    }
                },
                storage: {
                    type: 'object',
                    properties: {
                        configured: { type: 'boolean' },
                        service: { type: 'string' }
                    }
                }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestController.prototype, "getServicesStatus", null);
__decorate([
    (0, common_1.Post)('integration-test'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Full integration test',
        description: 'Tests both email and storage services together'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Integration test results',
        schema: {
            type: 'object',
            properties: {
                email: { type: 'object' },
                storage: { type: 'object' },
                overall: { type: 'object' }
            }
        }
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "fullIntegrationTest", null);
exports.TestController = TestController = __decorate([
    (0, swagger_1.ApiTags)('Test'),
    (0, common_1.Controller)('test'),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TestController);
//# sourceMappingURL=test.controller.js.map