import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
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
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
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
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(context: AuthContext, dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: context.tenantId,
          email,
        },
      },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const role = await this.prisma.role.findUnique({
      where: {
        name: dto.role,
      },
    });

    if (!role) {
      throw new NotFoundException(`Role ${dto.role} not found`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId: context.tenantId,
        roleId: role.id,
        name: dto.name,
        email,
        passwordHash,
      },
      include: {
        role: true,
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      metadata: {
        role: dto.role,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role.name,
    };
  }

  async update(context: AuthContext, id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (dto.name) {
      updateData.name = dto.name;
    }

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: context.tenantId,
            email,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('A user with this email already exists');
      }

      updateData.email = email;
    }

    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.role) {
      const role = await this.prisma.role.findUnique({
        where: { name: dto.role },
      });

      if (!role) {
        throw new NotFoundException(`Role ${dto.role} not found`);
      }

      updateData.roleId = role.id;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: id,
      metadata: {
        ...dto,
      } as Record<string, unknown>,
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      tenantId: updated.tenantId,
      role: updated.role.name,
    };
  }

  async delete(context: AuthContext, id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'USER_DELETED',
      entity: 'User',
      entityId: id,
    });

    return {
      message: 'User deleted successfully',
      id,
    };
  }
}
