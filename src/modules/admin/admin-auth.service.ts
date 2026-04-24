import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../core/database/prisma.service';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: AdminRegisterDto) {
    const { email, password, firstName, lastName, role } = registerDto;

    // Check if admin user already exists
    const existingAdmin = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw new ConflictException('Admin user with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = await this.prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Generate JWT tokens
    const payload = {
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      type: 'admin',
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      adminUser,
      access_token,
      refresh_token,
    };
  }

  async login(loginDto: AdminLoginDto) {
    const { email, password } = loginDto;

    // Find admin user
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    if (!adminUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!adminUser.isActive) {
      throw new UnauthorizedException('Admin account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.adminUser.update({
      where: { id: adminUser.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT tokens
    const payload = {
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      type: 'admin',
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
        isActive: adminUser.isActive,
        lastLoginAt: adminUser.lastLoginAt,
        createdAt: adminUser.createdAt,
      },
      access_token,
      refresh_token,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      if (payload.type !== 'admin') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Find admin user
      const adminUser = await this.prisma.adminUser.findUnique({
        where: { id: payload.sub },
      });

      if (!adminUser || !adminUser.isActive) {
        throw new UnauthorizedException('Admin user not found or deactivated');
      }

      // Generate new access token
      const newPayload = {
        sub: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        type: 'admin',
      };

      const access_token = this.jwtService.sign(newPayload, {
        expiresIn: '24h',
      });

      return { access_token };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateAdminUser(adminId: string): Promise<any> {
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!adminUser || !adminUser.isActive) {
      return null;
    }

    return adminUser;
  }
}
