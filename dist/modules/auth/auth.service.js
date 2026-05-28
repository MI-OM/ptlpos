"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../core/database/prisma.service");
const email_service_1 = require("../email/email.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    emailService;
    configService;
    constructor(prisma, jwtService, emailService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.configService = configService;
    }
    async register(dto) {
        const email = dto.email.trim().toLowerCase();
        const existingUser = await this.prisma.user.findFirst({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('This email is already registered. Please use a different email or login instead.');
        }
        const tenant = await this.prisma.tenant.create({
            data: {
                name: dto.organizationName,
            },
        });
        const adminRole = await this.prisma.role.findUnique({
            where: { name: 'ADMIN' },
        });
        if (!adminRole) {
            throw new Error('ADMIN role not found in database');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                tenantId: tenant.id,
                roleId: adminRole.id,
                name: dto.name,
                email,
                passwordHash,
            },
            include: {
                role: true,
            },
        });
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role.name,
        };
        const access_token = this.jwtService.sign(payload);
        const refresh_token = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });
        const verification = await this.generateVerificationToken(tenant.id, email);
        return {
            access_token,
            refresh_token,
            tenant: {
                id: tenant.id,
                name: tenant.name,
            },
            user: {
                userId: user.id,
                tenantId: user.tenantId,
                role: user.role.name,
                name: user.name,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                lastLoginAt: new Date().toISOString(),
            },
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                tenantId_email: {
                    tenantId: dto.tenantId,
                    email: dto.email,
                },
            },
            include: {
                role: true,
                tenant: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isEmailVerified) {
            throw new common_1.UnauthorizedException('Email not verified. Please check your inbox.');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role.name,
        };
        const access_token = this.jwtService.sign(payload);
        const refresh_token = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });
        return {
            access_token,
            refresh_token,
            user: {
                userId: user.id,
                tenantId: user.tenantId,
                role: user.role.name,
                name: user.name,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                lastLoginAt: new Date().toISOString(),
            },
        };
    }
    async loginWithEmail(dto) {
        const emailDomain = dto.email.split('@')[1];
        const user = await this.prisma.user.findFirst({
            where: {
                email: dto.email,
            },
            include: {
                role: true,
                tenant: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isEmailVerified) {
            throw new common_1.UnauthorizedException('Email not verified. Please check your inbox.');
        }
        if (user.tenant && user.tenant.website && user.tenant.website.includes(emailDomain)) {
            await this.logSecurityEvent('EMAIL_DOMAIN_MISMATCH', {
                userId: user.id,
                email: dto.email,
                tenantWebsite: user.tenant.website,
                emailDomain,
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role.name,
        };
        const access_token = this.jwtService.sign(payload);
        const refresh_token = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });
        return {
            access_token,
            refresh_token,
            user: {
                userId: user.id,
                tenantId: user.tenantId,
                role: user.role.name,
                name: user.name,
                email: user.email,
            },
            tenant: {
                id: user.tenantId,
                name: user.tenant?.name,
            },
        };
    }
    async me(context) {
        return this.prisma.user.findFirst({
            where: {
                id: context.userId,
                tenantId: context.tenantId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                tenantId: true,
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        });
    }
    async refresh(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const user = await this.prisma.user.findFirst({
                where: {
                    id: payload.sub,
                    tenantId: payload.tenantId,
                },
                include: {
                    role: true,
                },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            const newPayload = {
                sub: user.id,
                email: user.email,
                tenantId: user.tenantId,
                role: user.role.name,
            };
            const access_token = this.jwtService.sign(newPayload);
            const refresh_token = this.jwtService.sign(newPayload, {
                expiresIn: '7d',
            });
            return {
                access_token,
                refresh_token,
                user: {
                    userId: user.id,
                    tenantId: user.tenantId,
                    role: user.role.name,
                    name: user.name,
                    email: user.email,
                },
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
    async requestEmailVerification(emailOrTenantId, email) {
        if (!email) {
            email = emailOrTenantId;
            const user = await this.prisma.user.findFirst({
                where: { email },
                include: { tenant: true },
            });
            if (!user) {
                throw new common_1.BadRequestException('User not found with this email');
            }
            const tenantId = user.tenantId;
            return this.generateVerificationToken(tenantId, email);
        }
        const tenantId = emailOrTenantId;
        return this.generateVerificationToken(tenantId, email);
    }
    async generateVerificationToken(tenantId, email) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.BadRequestException('Tenant not found');
        }
        if (tenant.isEmailVerified && tenant.email === email) {
            return {
                message: 'Email is already verified',
                email,
            };
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.prisma.verificationToken.create({
            data: {
                tenantId,
                email,
                token,
                expiresAt,
            },
        });
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
        const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
        await this.emailService.sendVerificationEmail(email, email, verificationUrl);
        return {
            message: 'Verification token sent. Check your email.',
            email,
            expiresAt,
        };
    }
    async verifyEmail(token, tenantId) {
        if (!tenantId) {
            const verificationToken = await this.prisma.verificationToken.findUnique({
                where: { token },
            });
            if (!verificationToken) {
                return {
                    message: 'Email verified successfully',
                    email: 'unknown',
                    tenant: null,
                };
            }
            return this.processEmailVerification(verificationToken.tenantId, token);
        }
        return this.processEmailVerification(tenantId, token);
    }
    async processEmailVerification(tenantId, token) {
        const verificationToken = await this.prisma.verificationToken.findUnique({
            where: { token },
        });
        if (!verificationToken) {
            throw new common_1.BadRequestException('Invalid verification token');
        }
        if (verificationToken.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Token does not belong to this tenant');
        }
        if (verificationToken.expiresAt < new Date()) {
            await this.prisma.verificationToken.delete({
                where: { id: verificationToken.id },
            });
            throw new common_1.BadRequestException('Verification token has expired');
        }
        const existingTenant = await this.prisma.tenant.findUnique({
            where: { email: verificationToken.email },
        });
        if (existingTenant && existingTenant.id !== tenantId) {
            throw new common_1.ConflictException('This email is already in use by another organization');
        }
        const results = await this.prisma.$transaction([
            this.prisma.tenant.update({
                where: { id: tenantId },
                data: {
                    email: verificationToken.email,
                    isEmailVerified: true,
                },
            }),
            this.prisma.user.updateMany({
                where: {
                    tenantId,
                    email: verificationToken.email,
                },
                data: {
                    isEmailVerified: true,
                },
            }),
            this.prisma.verificationToken.delete({
                where: { id: verificationToken.id },
            }),
        ]);
        return {
            message: 'Email verified successfully',
            email: verificationToken.email,
            tenant: {
                id: results[0].id,
                name: results[0].name,
            },
        };
    }
    async requestPasswordReset(tenantId, email) {
        const user = await this.prisma.user.findUnique({
            where: {
                tenantId_email: {
                    tenantId,
                    email,
                },
            },
        });
        if (!user) {
            return {
                message: 'If the email exists, a password reset link has been sent',
                email,
            };
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
        await this.emailService.sendPasswordResetEmail(email, user.name, token, resetUrl);
        return {
            message: 'Password reset token sent. Check your email.',
            email,
            expiresAt,
        };
    }
    async resetPassword(token, newPassword) {
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: { token },
            include: {
                user: true,
            },
        });
        if (!resetToken) {
            throw new common_1.BadRequestException('Invalid reset token');
        }
        if (resetToken.expiresAt < new Date()) {
            await this.prisma.passwordResetToken.delete({
                where: { id: resetToken.id },
            });
            throw new common_1.BadRequestException('Reset token has expired');
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: resetToken.userId },
                data: { passwordHash },
            }),
            this.prisma.passwordResetToken.delete({
                where: { id: resetToken.id },
            }),
        ]);
        return {
            message: 'Password reset successfully',
            user: {
                id: resetToken.user.id,
                email: resetToken.user.email,
            },
        };
    }
    async changePassword(context, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({
            where: { id: context.userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });
        await this.logSecurityEvent('PASSWORD_CHANGED', {
            tenantId: context.tenantId,
            userId: user.id,
        });
        return {
            message: 'Password changed successfully',
        };
    }
    async logSecurityEvent(eventType, metadata) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    tenantId: metadata.tenantId || 'system',
                    userId: metadata.userId,
                    action: eventType,
                    entity: 'AUTH',
                    entityId: metadata.userId,
                    metadata: JSON.stringify(metadata),
                },
            });
        }
        catch (error) {
            console.error('Failed to log security event:', error);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        email_service_1.EmailService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map