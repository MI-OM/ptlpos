import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { AuthContext } from 'src/core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            inventories: true,
            sales: true,
            purchaseOrders: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async create(context: AuthContext, dto: CreateBranchDto) {
    // Check for duplicate branch name within tenant
    const existing = await this.prisma.branch.findFirst({
      where: {
        tenantId: context.tenantId,
        name: dto.name,
      },
    });

    if (existing) {
      throw new ConflictException('A branch with this name already exists for your tenant');
    }

    const branch = await this.prisma.branch.create({
      data: {
        tenantId: context.tenantId,
        ...dto,
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'BRANCH_CREATED',
      entity: 'Branch',
      entityId: branch.id,
      metadata: dto as unknown as Prisma.JsonObject,
    });

    return branch;
  }

  async update(context: AuthContext, id: string, dto: UpdateBranchDto) {
    await this.findOne(context.tenantId, id);

    // Check for duplicate branch name (excluding current branch)
    if (dto.name) {
      const existing = await this.prisma.branch.findFirst({
        where: {
          tenantId: context.tenantId,
          name: dto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('A branch with this name already exists for your tenant');
      }
    }

    const branch = await this.prisma.branch.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'BRANCH_UPDATED',
      entity: 'Branch',
      entityId: id,
      metadata: dto as Prisma.JsonObject,
    });

    return branch;
  }

  async delete(context: AuthContext, id: string) {
    const branch = await this.findOne(context.tenantId, id);

    // Check if branch has inventory or transactions
    const inventoryCount = await this.prisma.inventory.count({
      where: {
        tenantId: context.tenantId,
        branchId: id,
      },
    });

    const saleCount = await this.prisma.sale.count({
      where: {
        tenantId: context.tenantId,
        branchId: id,
      },
    });

    if (inventoryCount > 0 || saleCount > 0) {
      throw new ConflictException(
        'Cannot delete branch with inventory or sales data. Transfer or archive data first.'
      );
    }

    await this.prisma.branch.delete({
      where: { id },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'BRANCH_DELETED',
      entity: 'Branch',
      entityId: id,
    });

    return { success: true };
  }
}
