import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryTransactionType, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { RunProductionDto } from './dto/run-production.dto';

@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async run(context: AuthContext, dto: RunProductionDto) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        productId: dto.productId,
        product: {
          tenantId: context.tenantId,
        },
      },
      include: {
        items: true,
        product: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found for this product');
    }

    const result = await this.prisma.$transaction(async tx => {
      for (const item of recipe.items) {
        const inventory = await tx.inventory.findFirst({
          where: {
            tenantId: context.tenantId,
            branchId: context.branchId,
            productId: item.rawMaterialId,
            productVariantId: null,
          },
        });

        if (!inventory) {
          throw new NotFoundException(
            `Inventory row missing for raw material ${item.rawMaterialId}`
          );
        }

        const requiredQuantity = new Prisma.Decimal(item.quantity).mul(dto.quantityProduced);
        const nextQuantity = new Prisma.Decimal(inventory.quantity).sub(requiredQuantity);

        if (nextQuantity.lessThan(0)) {
          throw new ConflictException(`Insufficient stock for raw material ${item.rawMaterialId}`);
        }

        await tx.inventory.update({
          where: {
            id: inventory.id,
          },
          data: {
            quantity: nextQuantity,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            tenantId: context.tenantId,
            branchId: context.branchId,
            productId: item.rawMaterialId,
            type: InventoryTransactionType.PRODUCTION,
            quantity: requiredQuantity.mul(-1),
            balanceAfter: nextQuantity,
            referenceType: 'production_input',
            referenceId: recipe.productId,
          },
        });
      }

      const finishedGoodsInventory = await tx.inventory.findFirst({
        where: {
          tenantId: context.tenantId,
          branchId: context.branchId,
          productId: recipe.productId,
          productVariantId: null,
        },
      });

      if (!finishedGoodsInventory) {
        throw new NotFoundException(
          `Inventory row missing for finished product ${recipe.productId}`
        );
      }

      const finishedQuantity = new Prisma.Decimal(finishedGoodsInventory.quantity).add(
        dto.quantityProduced
      );

      await tx.inventory.update({
        where: {
          id: finishedGoodsInventory.id,
        },
        data: {
          quantity: finishedQuantity,
        },
      });

      const batch = await tx.productionBatch.create({
        data: {
          tenantId: context.tenantId,
          productId: recipe.productId,
          quantityProduced: dto.quantityProduced,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          tenantId: context.tenantId,
          branchId: context.branchId,
          productId: recipe.productId,
          type: InventoryTransactionType.PRODUCTION,
          quantity: dto.quantityProduced,
          balanceAfter: finishedQuantity,
          referenceType: 'production_output',
          referenceId: batch.id,
        },
      });

      return tx.productionBatch.findUniqueOrThrow({
        where: {
          id: batch.id,
        },
      });
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'PRODUCTION_RUN',
      entity: 'ProductionBatch',
      entityId: result.id,
      metadata: dto as unknown as Prisma.JsonObject,
    });

    return result;
  }

  async getOrders(context: AuthContext) {
    // Return production orders based on production batches
    const batches = await this.prisma.productionBatch.findMany({
      where: {
        product: {
          tenantId: context.tenantId,
        },
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return batches.map(batch => ({
      id: batch.id,
      product: batch.product.name,
      quantity: batch.quantityProduced,
      status: 'COMPLETED',
      progress: 100,
      startDate: batch.createdAt,
      expectedDate: batch.createdAt,
    }));
  }

  async getRecipes(context: AuthContext) {
    const recipes = await this.prisma.recipe.findMany({
      where: {
        product: {
          tenantId: context.tenantId,
        },
      },
      include: {
        items: {
          include: {
            rawMaterial: true,
          },
        },
        product: true,
      },
    });

    return recipes.map(recipe => {
      const materialCost = recipe.items.reduce((sum, item) => {
        return sum.add(new Prisma.Decimal(item.rawMaterial.cost || 0).mul(item.quantity));
      }, new Prisma.Decimal(0));

      const productPrice = new Prisma.Decimal(recipe.product.price || 0);
      const margin = productPrice.sub(materialCost);
      const marginPercent = materialCost.greaterThan(0) 
        ? margin.div(productPrice).mul(100).toNumber() 
        : 0;

      return {
        id: recipe.id,
        productId: recipe.productId,
        productName: recipe.product.name,
        productSku: recipe.product.sku,
        productPrice: productPrice.toNumber(),
        materialCost: materialCost.toNumber(),
        margin: margin.toNumber(),
        marginPercent,
        materials: recipe.items.map(item => ({
          materialId: item.rawMaterialId,
          materialName: item.rawMaterial.name,
          quantity: item.quantity,
          unitCost: item.rawMaterial.cost || 0,
          totalCost: new Prisma.Decimal(item.rawMaterial.cost || 0).mul(item.quantity).toNumber(),
        })),
      };
    });
  }

  async getMaterials(context: AuthContext) {
    // Return raw materials from inventory
    const materials = await this.prisma.inventory.findMany({
      where: {
        tenantId: context.tenantId,
        product: {
          type: 'SIMPLE',
        },
      },
      include: {
        product: true,
      },
      take: 50,
    });

    return materials.map(material => ({
      id: material.id,
      name: material.product.name,
      stock: material.quantity,
      unit: 'pcs',
      reorderLevel: 10,
    }));
  }

  async getMachines(context: AuthContext) {
    // Return mock machine data (would be stored in database in production)
    return [
      {
        id: 'machine-1',
        name: 'Packaging Machine A',
        status: 'OPERATIONAL',
        uptime: 98.5,
        lastMaintenance: new Date('2026-04-15'),
      },
      {
        id: 'machine-2',
        name: 'Mixing Machine B',
        status: 'OPERATIONAL',
        uptime: 95.2,
        lastMaintenance: new Date('2026-04-10'),
      },
      {
        id: 'machine-3',
        name: 'Labeling Machine C',
        status: 'MAINTENANCE',
        uptime: 92.1,
        lastMaintenance: new Date('2026-04-20'),
      },
    ];
  }
}
