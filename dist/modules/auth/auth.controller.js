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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const public_decorator_1 = require("../../core/decorators/public.decorator");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const login_email_dto_1 = require("./dto/login-email.dto");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
const register_dto_1 = require("./dto/register.dto");
const email_verification_dto_1 = require("./dto/email-verification.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    register(dto) {
        return this.authService.register(dto);
    }
    async login(dto) {
        return this.authService.login(dto);
    }
    async loginWithEmail(dto) {
        return this.authService.loginWithEmail(dto);
    }
    refresh(dto) {
        return this.authService.refresh(dto.refresh_token);
    }
    me(user) {
        return this.authService.me(user);
    }
    requestEmailVerification(dto, user) {
        return this.authService.requestEmailVerification(dto.email);
    }
    verifyEmail(dto, user) {
        return this.authService.verifyEmail(dto.token);
    }
    requestPasswordReset(dto) {
        return this.authService.requestPasswordReset(dto.tenantId, dto.email);
    }
    resetPassword(dto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }
    changePassword(user, dto) {
        return this.authService.changePassword(user, dto.currentPassword, dto.newPassword);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({
        summary: 'Register new organization and create admin user',
        description: 'Create a new tenant (organization) and the first admin user. An email verification token is automatically sent to the organization email. No authentication required.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Organization and user successfully created with email verification',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                tenant: {
                    id: 'clh7x1q0a0000qa10f0f0f0f0',
                    name: 'Acme Corporation',
                },
                user: {
                    userId: 'clh7x1q0b0000qa20f0f0f0f0',
                    tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
                    role: 'ADMIN',
                    name: 'John Doe',
                    email: 'john@acme.com',
                },
                emailVerification: {
                    message: 'Verification token sent. Check your email.',
                    email: 'contact@acme.com',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation error or organization already exists',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({
        summary: 'User login with tenant ID',
        description: 'Authenticate user with email, password, and tenant ID',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Login successful',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                user: {
                    userId: 'clh7x1q0b0000qa20f0f0f0f0',
                    tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
                    role: 'ADMIN',
                    name: 'John Doe',
                    email: 'john@acme.com',
                },
                tenant: {
                    id: 'clh7x1q0a0000qa10f0f0f0f0',
                    name: 'Acme Corporation',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid credentials',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.Post)('login/email'),
    (0, swagger_1.ApiOperation)({
        summary: 'User login with email only (automatic tenant discovery)',
        description: 'Authenticate user with just email and password. System will automatically discover the tenant.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Login successful',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                user: {
                    userId: 'clh7x1q0b0000qa20f0f0f0',
                    tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
                    role: 'ADMIN',
                    name: 'John Doe',
                    email: 'john@acme.com',
                },
                tenant: {
                    id: 'clh7x1q0a0000qa10f0f0f0f0',
                    name: 'Acme Corporation',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid credentials',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_email_dto_1.LoginEmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithEmail", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiOperation)({
        summary: 'Refresh access token',
        description: 'Use a refresh token to get a new pair of access and refresh tokens.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'New tokens issued',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                user: {
                    userId: 'clh7x1q0b0000qa20f0f0f0f0',
                    tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
                    role: 'ADMIN',
                    name: 'John Doe',
                    email: 'john@acme.com',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid or expired refresh token',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get current user profile',
        description: 'Retrieve authenticated user information. Requires valid JWT token.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Current user profile',
        schema: {
            example: {
                id: 'clh7x1q0b0000qa20f0f0f0f0',
                name: 'John Doe',
                email: 'john@acme.com',
                tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
                role: {
                    name: 'ADMIN',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - missing or invalid token',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('email/verify-request'),
    (0, swagger_1.ApiOperation)({
        summary: 'Request email verification token',
        description: 'Send a verification token to the organization email. No authentication required.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Verification token sent',
        schema: {
            example: {
                message: 'Verification token sent. Check your email.',
                email: 'contact@acme.com',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [email_verification_dto_1.RequestEmailVerificationDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestEmailVerification", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('email/verify'),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify email with token',
        description: 'Confirm email ownership using the verification token received via email.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Email verified successfully',
        schema: {
            example: {
                message: 'Email verified successfully',
                email: 'contact@acme.com',
                tenant: {
                    id: 'clh7x1q0a0000qa10f0f0f0f0',
                    name: 'Acme Corporation',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid or expired verification token',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [email_verification_dto_1.VerifyEmailDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('password/reset-request'),
    (0, swagger_1.ApiOperation)({
        summary: 'Request password reset token',
        description: 'Send a password reset token to user email. No authentication required.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Password reset token sent (for security, same message for existing and non-existing emails)',
        schema: {
            example: {
                message: 'If the email exists, a password reset link has been sent',
                email: 'john@example.com',
                token: 'xyz789abc123...',
                expiresAt: '2025-12-01T13:00:00Z',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [email_verification_dto_1.RequestPasswordResetDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestPasswordReset", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('password/reset'),
    (0, swagger_1.ApiOperation)({
        summary: 'Reset password with token',
        description: 'Set a new password using the reset token received via email.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Password reset successfully',
        schema: {
            example: {
                message: 'Password reset successfully',
                user: {
                    id: 'clh7x1q0b0000qa20f0f0f0f0',
                    email: 'john@example.com',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid or expired reset token',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [email_verification_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('change-password'),
    (0, swagger_1.ApiOperation)({
        summary: 'Change password for authenticated user',
        description: 'Change the password for the currently authenticated user by providing the current password.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Password changed successfully',
        schema: {
            example: {
                message: 'Password changed successfully',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Current password is incorrect',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "changePassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map