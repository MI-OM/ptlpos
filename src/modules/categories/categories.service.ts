import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Category } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { RedisService } from '../../core/database/redis.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService
  ) {}

  async findAll(tenantId: string, query: QueryCategoriesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const normalizedQuery = query.q?.trim();
    const cacheKey = [
      `tenant:${tenantId}:categories`,
      `page:${page}`,
      `limit:${limit}`,
      `q:${normalizedQuery ?? ''}`,
      `isActive:${query.isActive ?? ''}`,
    ].join(':');
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;
    const where: Prisma.CategoryWhereInput = {
      tenantId,
      isActive: query.isActive,
      name: normalizedQuery
        ? {
            contains: normalizedQuery,
            mode: 'insensitive',
          }
        : undefined,
    };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    const result = {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  async findOne(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(context: AuthContext, dto: CreateCategoryDto) {
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        tenantId: context.tenantId,
        name: dto.name,
      },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = await this.prisma.category.create({
      data: {
        tenantId: context.tenantId,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });

    await this.redis.del(`tenant:${context.tenantId}:categories:page:1:limit:20`);
    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'CATEGORY_CREATED',
      entity: 'Category',
      entityId: category.id,
      metadata: {
        name: category.name,
      },
    });

    return category;
  }

  async update(context: AuthContext, id: string, dto: UpdateCategoryDto) {
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // Check if name is being updated and if it conflicts with existing category
    if (dto.name && dto.name !== existingCategory.name) {
      const nameConflict = await this.prisma.category.findFirst({
        where: {
          tenantId: context.tenantId,
          name: dto.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
      },
    });

    await this.redis.del(`tenant:${context.tenantId}:categories:page:1:limit:20`);
    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'CATEGORY_UPDATED',
      entity: 'Category',
      entityId: updatedCategory.id,
      metadata: {
        changes: dto,
      },
    });

    return updatedCategory;
  }

  async remove(context: AuthContext, id: string) {
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    if (existingCategory._count.products > 0) {
      throw new BadRequestException('Cannot delete category with associated products');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    await this.redis.del(`tenant:${context.tenantId}:categories:page:1:limit:20`);
    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'CATEGORY_DELETED',
      entity: 'Category',
      entityId: id,
    });

    return { success: true };
  }
}
