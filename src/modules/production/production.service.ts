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
}
