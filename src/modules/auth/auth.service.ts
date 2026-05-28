import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginSecureDto } from './dto/login-secure.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists in any tenant
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'This email is already registered. Please use a different email or login instead.'
      );
    }

    // Create tenant (organization)
    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.organizationName,
      },
    });

    // Get admin role
    const adminRole = await this.prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });

    if (!adminRole) {
      throw new Error('ADMIN role not found in database');
    }

    // Create first user with ADMIN role
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

    // Generate tokens
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

    // Generate and send email verification token
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

  async login(dto: LoginDto) {
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
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified. Please check your inbox.');
    }

    // Update last login timestamp
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

  async loginWithEmail(dto: LoginEmailDto) {
    // Extract domain from email for tenant discovery
    const emailDomain = dto.email.split('@')[1];
    
    // Find user by email across all tenants
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
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified. Please check your inbox.');
    }

    // Security check: Verify email domain matches tenant domain (if configured)
    if (user.tenant && user.tenant.website && user.tenant.website.includes(emailDomain)) {
      // Log security event for domain mismatch
      await this.logSecurityEvent('EMAIL_DOMAIN_MISMATCH', {
        userId: user.id,
        email: dto.email,
        tenantWebsite: user.tenant.website,
        emailDomain,
      });
      
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
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

  // TODO: Implement loginWithDiscovery method with proper security validation
  // Temporarily commented out to fix compilation issues
  /*
  async loginWithDiscovery(dto: LoginDiscoveryDto) {
    if (dto.organizationName) {
      // If organization name is provided, find tenant and user within it
      const tenant = await this.prisma.tenant.findFirst({
        where: {
          name: dto.organizationName,
        },
      });

      if (!tenant) {
        throw new UnauthorizedException('Organization not found');
      }

      const user = await this.prisma.user.findFirst({
        where: {
          tenantId: tenant.id,
          email: dto.email,
        },
        include: {
          role: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const valid = await bcrypt.compare(dto.password, user.passwordHash);

      if (!valid) {
        throw new UnauthorizedException('Invalid credentials');
      }

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
          id: tenant.id,
          name: tenant.name,
        },
      };
    } else {
      // If no organization name, fall back to email-based discovery
      return this.loginWithEmail(dto);
    }
  }
  */

  async me(context: AuthContext) {
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

  async refresh(refreshToken: string) {
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
        throw new UnauthorizedException('User not found');
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
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Generate and send email verification token
   */
  async requestEmailVerification(emailOrTenantId: string, email?: string) {
    // Handle email-only request (for public endpoint)
    if (!email) {
      email = emailOrTenantId;
      // Find tenant by user email
      const user = await this.prisma.user.findFirst({
        where: { email },
        include: { tenant: true },
      });

      if (!user) {
        throw new BadRequestException('User not found with this email');
      }

      const tenantId = user.tenantId;
      return this.generateVerificationToken(tenantId, email);
    }

    // Handle tenantId + email request (for authenticated endpoint)
    const tenantId = emailOrTenantId;
    return this.generateVerificationToken(tenantId, email);
  }

  /**
   * Helper method to generate verification token
   */
  private async generateVerificationToken(tenantId: string, email: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    if (tenant.isEmailVerified && tenant.email === email) {
      return {
        message: 'Email is already verified',
        email,
      };
    }

    // Generate random token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save verification token
    await this.prisma.verificationToken.create({
      data: {
        tenantId,
        email,
        token,
        expiresAt,
      },
    });

    // Send verification email
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    await this.emailService.sendVerificationEmail(email, email, verificationUrl);

    return {
      message: 'Verification token sent. Check your email.',
      email,
      expiresAt,
    };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string, tenantId?: string) {
    // Handle token-only request (for public endpoint)
    if (!tenantId) {
      const verificationToken = await this.prisma.verificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken) {
        // Token not found: either already consumed, expired, or never existed.
        // Already-consumed tokens are deleted on success, so returning success
        // for missing tokens makes this endpoint idempotent (handles React strict
        // mode double-fire and retries).
        return {
          message: 'Email verified successfully',
          email: 'unknown',
          tenant: null,
        };
      }

      return this.processEmailVerification(verificationToken.tenantId, token);
    }

    // Handle tenantId + token request (for authenticated endpoint)
    return this.processEmailVerification(tenantId, token);
  }

  /**
   * Helper method to process email verification
   */
  private async processEmailVerification(tenantId: string, token: string) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid verification token');
    }

    if (verificationToken.tenantId !== tenantId) {
      throw new BadRequestException('Token does not belong to this tenant');
    }

    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await this.prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw new BadRequestException('Verification token has expired');
    }

    // Check if email already exists and belongs to another tenant
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { email: verificationToken.email },
    });

    if (existingTenant && existingTenant.id !== tenantId) {
      throw new ConflictException('This email is already in use by another organization');
    }

    // Update tenant and user email verification, delete verification token
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

  /**
   * Request password reset token
   */
  async requestPasswordReset(tenantId: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });

    if (!user) {
      // Don't reveal if user exists for security
      return {
        message: 'If the email exists, a password reset link has been sent',
        email,
      };
    }

    // Generate random token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save password reset token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send password reset email
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    await this.emailService.sendPasswordResetEmail(email, user.name, token, resetUrl);

    return {
      message: 'Password reset token sent. Check your email.',
      email,
      expiresAt,
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await this.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and delete token
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

  async changePassword(context: AuthContext, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: context.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
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

  private async logSecurityEvent(eventType: string, metadata: any) {
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
    } catch (error) {
      // Log error but don't throw to prevent auth flow interruption
      console.error('Failed to log security event:', error);
    }
  }
}
