import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
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
    };
  }

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
  async requestEmailVerification(tenantId: string, email: string) {
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
    const token = crypto.randomBytes(32).toString('hex');
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

    // In a real application, send email with verification link
    // For demo purposes, return the token
    return {
      message: 'Verification token sent. Check your email.',
      email,
      token, // For testing only - remove in production
      expiresAt,
    };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(tenantId: string, token: string) {
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

    // Update tenant and delete verification token
    const updatedTenant = await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          email: verificationToken.email,
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
        id: updatedTenant[0].id,
        name: updatedTenant[0].name,
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
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save password reset token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // In a real application, send email with reset link
    // For demo purposes, return the token
    return {
      message: 'Password reset token sent. Check your email.',
      email,
      token, // For testing only - remove in production
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
}
