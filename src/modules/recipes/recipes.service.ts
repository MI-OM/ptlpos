import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  findAll(tenantId: string) {
    return this.prisma.recipe.findMany({
      where: {
        product: {
          tenantId,
        },
      },
      include: {
        product: true,
        items: {
          include: {
            rawMaterial: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id,
        product: {
          tenantId,
        },
      },
      include: {
        product: true,
        items: {
          include: {
            rawMaterial: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return recipe;
  }

  async create(context: AuthContext, dto: CreateRecipeDto) {
    await this.ensureProductsExist(
      context.tenantId,
      dto.productId,
      dto.items.map(item => item.rawMaterialId)
    );

    const existing = await this.prisma.recipe.findUnique({
      where: {
        productId: dto.productId,
      },
    });

    if (existing) {
      throw new ConflictException('Recipe already exists for this product');
    }

    const recipe = await this.prisma.recipe.create({
      data: {
        productId: dto.productId,
        items: {
          create: dto.items.map(item => ({
            rawMaterialId: item.rawMaterialId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        product: true,
        items: {
          include: {
            rawMaterial: true,
          },
        },
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'RECIPE_CREATED',
      entity: 'Recipe',
      entityId: recipe.id,
      metadata: dto as unknown as Prisma.JsonObject,
    });

    return recipe;
  }

  async update(context: AuthContext, id: string, dto: UpdateRecipeDto) {
    const existing = await this.findOne(context.tenantId, id);
    const productId = dto.productId ?? existing.productId;
    const rawMaterialIds =
      dto.items?.map(item => item.rawMaterialId) ?? existing.items.map(item => item.rawMaterialId);

    await this.ensureProductsExist(context.tenantId, productId, rawMaterialIds);

    const recipe = await this.prisma.$transaction(async tx => {
      await tx.recipeItem.deleteMany({
        where: {
          recipeId: id,
        },
      });

      return tx.recipe.update({
        where: {
          id,
        },
        data: {
          productId,
          items: dto.items
            ? {
                create: dto.items.map(item => ({
                  rawMaterialId: item.rawMaterialId,
                  quantity: item.quantity,
                })),
              }
            : undefined,
        },
        include: {
          product: true,
          items: {
            include: {
              rawMaterial: true,
            },
          },
        },
      });
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'RECIPE_UPDATED',
      entity: 'Recipe',
      entityId: recipe.id,
      metadata: dto as Prisma.JsonObject,
    });

    return recipe;
  }

  private async ensureProductsExist(tenantId: string, productId: string, rawMaterialIds: string[]) {
    const requiredIds = Array.from(new Set([productId, ...rawMaterialIds]));
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        id: {
          in: requiredIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (products.length !== requiredIds.length) {
      throw new NotFoundException('One or more recipe products were not found');
    }
  }
}
