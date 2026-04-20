import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryTransactionType, Prisma, StocktakeStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { CreateStocktakeDto, RecordStocktakeCountsDto } from './dto/stocktake.dto';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async findAll(tenantId: string, branchId?: string) {
    return this.prisma.inventory.findMany({
      where: {
        tenantId,
        branchId,
      },
      include: {
        product: true,
        productVariant: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async lowStock(tenantId: string, threshold = 10, branchId?: string) {
    return this.prisma.inventory.findMany({
      where: {
        tenantId,
        branchId,
        quantity: {
          lte: threshold,
        },
      },
      include: {
        product: true,
        productVariant: true,
      },
      orderBy: [
        {
          quantity: 'asc',
        },
        {
          updatedAt: 'desc',
        },
      ],
    });
  }

  async history(tenantId: string, productId?: string, branchId?: string) {
    return this.prisma.inventoryTransaction.findMany({
      where: {
        tenantId,
        branchId,
        productId,
      },
      include: {
        product: true,
        productVariant: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });
  }

  async valuation(tenantId: string, branchId?: string) {
    const rows = await this.prisma.inventory.findMany({
      where: {
        tenantId,
        branchId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            cost: true,
          },
        },
        productVariant: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const items = rows.map(row => {
      const quantity = Number(row.quantity);
      const unitCost = Number(row.product.cost);
      const stockValue = quantity * unitCost;

      return {
        inventoryId: row.id,
        productId: row.productId,
        productVariantId: row.productVariantId,
        productName: row.product.name,
        variantName: row.productVariant?.name ?? null,
        sku: row.productVariant?.sku ?? row.product.sku ?? null,
        quantity,
        unitCost,
        stockValue,
      };
    });

    return {
      branchId: branchId ?? null,
      valuationMethod: 'STANDARD_COST',
      totals: {
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        stockValue: items.reduce((sum, item) => sum + item.stockValue, 0),
        itemCount: items.length,
      },
      items,
    };
  }

  async transfer(context: AuthContext, dto: TransferInventoryDto) {
    if (!context.branchId) {
      throw new BadRequestException('Inventory transfers require an active source branch');
    }

    if (dto.targetBranchId === context.branchId) {
      throw new BadRequestException('Target branch must be different from the source branch');
    }

    const targetBranch = await this.prisma.branch.findFirst({
      where: {
        id: dto.targetBranchId,
        tenantId: context.tenantId,
      },
    });

    if (!targetBranch) {
      throw new NotFoundException('Target branch not found');
    }

    const transferReference = `transfer_${Date.now()}`;

    const result = await this.prisma.$transaction(async tx => {
      const movedItems: Array<{
        productId: string;
        productVariantId: string | null;
        quantity: Prisma.Decimal;
        sourceInventoryId: string;
        targetInventoryId: string;
      }> = [];

      for (const item of dto.items) {
        const quantity = new Prisma.Decimal(item.quantity);
        const sourceInventory = await tx.inventory.findFirst({
          where: {
            tenantId: context.tenantId,
            branchId: context.branchId,
            productId: item.productId,
            productVariantId: item.productVariantId ?? null,
          },
        });

        if (!sourceInventory) {
          throw new NotFoundException(`Source inventory row not found for product ${item.productId}`);
        }

        const sourceNextQuantity = new Prisma.Decimal(sourceInventory.quantity).sub(quantity);

        if (sourceNextQuantity.lessThan(0)) {
          throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
        }

        const targetInventory = await tx.inventory.findFirst({
          where: {
            tenantId: context.tenantId,
            branchId: dto.targetBranchId,
            productId: item.productId,
            productVariantId: item.productVariantId ?? null,
          },
        });

        const updatedSourceInventory = await tx.inventory.update({
          where: {
            id: sourceInventory.id,
          },
          data: {
            quantity: sourceNextQuantity,
          },
        });

        const targetNextQuantity = new Prisma.Decimal(targetInventory?.quantity ?? 0).add(quantity);
        const updatedTargetInventory = targetInventory
          ? await tx.inventory.update({
              where: {
                id: targetInventory.id,
              },
              data: {
                quantity: targetNextQuantity,
              },
            })
          : await tx.inventory.create({
              data: {
                tenantId: context.tenantId,
                branchId: dto.targetBranchId,
                productId: item.productId,
                productVariantId: item.productVariantId,
                quantity: targetNextQuantity,
              },
            });

        await tx.inventoryTransaction.create({
          data: {
            tenantId: context.tenantId,
            branchId: context.branchId,
            productId: item.productId,
            productVariantId: item.productVariantId,
            type: InventoryTransactionType.ADJUSTMENT,
            quantity: quantity.mul(-1),
            balanceAfter: updatedSourceInventory.quantity,
            referenceType: 'inventory_transfer_out',
            referenceId: transferReference,
            note: item.note ?? dto.note,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            tenantId: context.tenantId,
            branchId: dto.targetBranchId,
            productId: item.productId,
            productVariantId: item.productVariantId,
            type: InventoryTransactionType.ADJUSTMENT,
            quantity,
            balanceAfter: updatedTargetInventory.quantity,
            referenceType: 'inventory_transfer_in',
            referenceId: transferReference,
            note: item.note ?? dto.note,
          },
        });

        movedItems.push({
          productId: item.productId,
          productVariantId: item.productVariantId ?? null,
          quantity,
          sourceInventoryId: updatedSourceInventory.id,
          targetInventoryId: updatedTargetInventory.id,
        });
      }

      return movedItems;
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'INVENTORY_TRANSFERRED',
      entity: 'InventoryTransfer',
      entityId: transferReference,
      metadata: {
        sourceBranchId: context.branchId,
        targetBranchId: dto.targetBranchId,
        itemCount: result.length,
      },
    });

    await this.checkAndCreateAlerts(context.tenantId);

    return {
      transferReference,
      sourceBranchId: context.branchId,
      targetBranchId: dto.targetBranchId,
      itemCount: result.length,
      items: result.map(item => ({
        productId: item.productId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
      })),
    };
  }

  async adjust(context: AuthContext, dto: AdjustInventoryDto) {
    if (
      dto.type !== InventoryTransactionType.ADJUSTMENT &&
      dto.type !== InventoryTransactionType.OPENING &&
      dto.type !== InventoryTransactionType.PURCHASE &&
      dto.type !== InventoryTransactionType.PRODUCTION
    ) {
      throw new BadRequestException(
        'Manual adjust only supports opening, purchase, production, or adjustment'
      );
    }

    const result = await this.prisma.$transaction(async tx => {
      const inventory = await tx.inventory.findFirst({
        where: {
          tenantId: context.tenantId,
          branchId: context.branchId,
          productId: dto.productId,
          productVariantId: dto.productVariantId ?? null,
        },
      });

      if (!inventory) {
        throw new NotFoundException('Inventory row not found');
      }

      const nextQuantity = new Prisma.Decimal(inventory.quantity).add(dto.quantity);

      if (nextQuantity.lessThan(0)) {
        throw new BadRequestException('Inventory cannot go below zero');
      }

      const updatedInventory = await tx.inventory.update({
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
          productId: dto.productId,
          productVariantId: dto.productVariantId,
          type: dto.type,
          quantity: dto.quantity,
          balanceAfter: nextQuantity,
          referenceType: 'inventory_adjustment',
          referenceId: inventory.id,
          note: dto.note,
        },
      });

      return updatedInventory;
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'INVENTORY_ADJUSTED',
      entity: 'Inventory',
      entityId: result.id,
      metadata: dto as unknown as Prisma.JsonObject,
    });

    await this.checkAndCreateAlerts(context.tenantId);

    return result;
  }

  async getAlerts(tenantId: string, resolved = false) {
    return this.prisma.lowStockAlert.findMany({
      where: {
        tenantId,
        isResolved: resolved,
      },
      include: {
        product: true,
        productVariant: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async checkAndCreateAlerts(tenantId: string, threshold = 10) {
    if (threshold < 0) {
      throw new BadRequestException('Threshold must be zero or greater');
    }

    const lowStockItems = await this.lowStock(tenantId, threshold);

    const existingAlerts = await this.prisma.lowStockAlert.findMany({
      where: {
        tenantId,
        isResolved: false,
      },
    });

    if (lowStockItems.length === 0) {
      if (existingAlerts.length > 0) {
        await this.prisma.lowStockAlert.updateMany({
          where: {
            tenantId,
            isResolved: false,
          },
          data: {
            isResolved: true,
            resolvedAt: new Date(),
          },
        });
      }

      return [];
    }

    const currentLowStockKeys = new Set(
      lowStockItems.map(item => `${item.productId}:${item.productVariantId ?? ''}`)
    );
    const staleAlertIds = existingAlerts
      .filter(alert => !currentLowStockKeys.has(`${alert.productId}:${alert.productVariantId ?? ''}`))
      .map(alert => alert.id);

    if (staleAlertIds.length > 0) {
      await this.prisma.lowStockAlert.updateMany({
        where: {
          id: {
            in: staleAlertIds,
          },
        },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
      });
    }

    const createdAlerts = await Promise.all(
      lowStockItems.map(async item => {
        const existing = await this.prisma.lowStockAlert.findFirst({
          where: {
            tenantId,
            productId: item.productId,
            productVariantId: item.productVariantId,
          },
        });

        if (existing) {
          return this.prisma.lowStockAlert.update({
            where: { id: existing.id },
            data: {
              quantity: item.quantity,
              isResolved: false,
              resolvedAt: null,
              updatedAt: new Date(),
            },
            include: {
              product: true,
              productVariant: true,
            },
          });
        }

        return this.prisma.lowStockAlert.create({
          data: {
            tenantId,
            productId: item.productId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          },
          include: {
            product: true,
            productVariant: true,
          },
        });
      })
    );

    return createdAlerts;
  }

  async resolveAlert(tenantId: string, alertId: string) {
    const alert = await this.prisma.lowStockAlert.findFirst({
      where: {
        id: alertId,
        tenantId,
      },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return this.prisma.lowStockAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  async createStocktake(context: AuthContext, dto: CreateStocktakeDto) {
    const stocktake = await this.prisma.stocktake.create({
      data: {
        tenantId: context.tenantId,
        name: dto.name,
        notes: dto.notes,
        status: StocktakeStatus.PLANNED,
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'STOCKTAKE_CREATED',
      entity: 'Stocktake',
      entityId: stocktake.id,
      metadata: {
        status: StocktakeStatus.PLANNED,
      },
    });

    return stocktake;
  }

  async startStocktake(context: AuthContext, stocktakeId: string) {
    const stocktake = await this.prisma.stocktake.findFirst({
      where: {
        id: stocktakeId,
        tenantId: context.tenantId,
      },
    });

    if (!stocktake) {
      throw new NotFoundException('Stocktake not found');
    }

    if (stocktake.status !== StocktakeStatus.PLANNED) {
      throw new BadRequestException('Can only start planned stocktakes');
    }

    const updated = await this.prisma.stocktake.update({
      where: { id: stocktakeId },
      data: {
        status: StocktakeStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'STOCKTAKE_STARTED',
      entity: 'Stocktake',
      entityId: stocktakeId,
    });

    return updated;
  }

  async cancelStocktake(context: AuthContext, stocktakeId: string) {
    const stocktake = await this.prisma.stocktake.findFirst({
      where: {
        id: stocktakeId,
        tenantId: context.tenantId,
      },
    });

    if (!stocktake) {
      throw new NotFoundException('Stocktake not found');
    }

    const cancellableStatuses: StocktakeStatus[] = [
      StocktakeStatus.PLANNED,
      StocktakeStatus.IN_PROGRESS,
    ];

    if (!cancellableStatuses.includes(stocktake.status)) {
      throw new BadRequestException('Only planned or in-progress stocktakes can be cancelled');
    }

    const updated = await this.prisma.stocktake.update({
      where: { id: stocktakeId },
      data: {
        status: StocktakeStatus.CANCELLED,
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'STOCKTAKE_CANCELLED',
      entity: 'Stocktake',
      entityId: stocktakeId,
      metadata: {
        previousStatus: stocktake.status,
      },
    });

    return updated;
  }

  async recordStocktakeCounts(
    context: AuthContext,
    stocktakeId: string,
    dto: RecordStocktakeCountsDto
  ) {
    const stocktake = await this.prisma.stocktake.findFirst({
      where: {
        id: stocktakeId,
        tenantId: context.tenantId,
      },
    });

    if (!stocktake) {
      throw new NotFoundException('Stocktake not found');
    }

    if (stocktake.status !== StocktakeStatus.IN_PROGRESS) {
      throw new BadRequestException('Stocktake must be in progress to record counts');
    }

    // Process all items in one transaction
    const lineItems = await this.prisma.$transaction(
      dto.items.map(item =>
        this.prisma.stocktakeLineItem.upsert({
          where: {
            unique_stocktake_item: {
              stocktakeId,
              productId: item.productId,
              productVariantId: item.productVariantId ?? null,
            },
          } as any,
          update: {
            physicalCount: new Prisma.Decimal(item.physicalCount),
            notes: item.notes,
          },
          create: {
            stocktakeId,
            productId: item.productId,
            productVariantId: item.productVariantId,
            systemCount: new Prisma.Decimal(0),
            physicalCount: new Prisma.Decimal(item.physicalCount),
            variance: new Prisma.Decimal(0),
            notes: item.notes,
          },
          include: {
            product: true,
            productVariant: true,
          },
        })
      )
    );

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'STOCKTAKE_COUNTS_RECORDED',
      entity: 'Stocktake',
      entityId: stocktakeId,
      metadata: {
        itemCount: lineItems.length,
      },
    });

    return lineItems;
  }

  async completeStocktake(context: AuthContext, stocktakeId: string) {
    const stocktake = await this.prisma.stocktake.findFirst({
      where: {
        id: stocktakeId,
        tenantId: context.tenantId,
      },
      include: {
        lineItems: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });

    if (!stocktake) {
      throw new NotFoundException('Stocktake not found');
    }

    if (stocktake.status !== StocktakeStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress stocktakes can be completed');
    }

    if (stocktake.lineItems.length === 0) {
      throw new BadRequestException('Cannot complete a stocktake without recorded counts');
    }

    // Calculate system counts and variance for all line items
    await Promise.all(
      stocktake.lineItems.map(async item => {
        const inventory = await this.prisma.inventory.findFirst({
          where: {
            tenantId: context.tenantId,
            branchId: context.branchId,
            productId: item.productId,
            productVariantId: item.productVariantId,
          },
        });

        const systemCount = inventory?.quantity ?? new Prisma.Decimal(0);
        const variance = new Prisma.Decimal(item.physicalCount).minus(systemCount);

        return this.prisma.stocktakeLineItem.update({
          where: { id: item.id },
          data: {
            systemCount,
            variance,
          },
        });
      })
    );

    const updated = await this.prisma.stocktake.update({
      where: { id: stocktakeId },
      data: {
        status: StocktakeStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        lineItems: true,
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'STOCKTAKE_COMPLETED',
      entity: 'Stocktake',
      entityId: stocktakeId,
      metadata: {
        itemsReviewed: updated.lineItems.length,
      },
    });

    return updated;
  }

  async getStocktake(tenantId: string, stocktakeId: string) {
    return this.prisma.stocktake.findFirst({
      where: {
        id: stocktakeId,
        tenantId,
      },
      include: {
        lineItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });
  }

  async listStocktakes(tenantId: string, status?: StocktakeStatus) {
    return this.prisma.stocktake.findMany({
      where: {
        tenantId,
        status,
      },
      include: {
        _count: {
          select: {
            lineItems: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async applyStocktakeAdjustments(context: AuthContext, stocktakeId: string) {
    const stocktake = await this.prisma.stocktake.findFirst({
      where: {
        id: stocktakeId,
        tenantId: context.tenantId,
      },
      include: {
        lineItems: true,
      },
    });

    if (!stocktake) {
      throw new NotFoundException('Stocktake not found');
    }

    if (stocktake.status !== StocktakeStatus.COMPLETED) {
      throw new BadRequestException('Only completed stocktakes can be applied');
    }

    // Apply adjustments within a transaction
    await this.prisma.$transaction(async tx => {
      for (const lineItem of stocktake.lineItems) {
        if (lineItem.variance.equals(0)) {
          continue; // Skip if no variance
        }

        const inventory = await tx.inventory.findFirstOrThrow({
          where: {
            tenantId: context.tenantId,
            branchId: context.branchId,
            productId: lineItem.productId,
            productVariantId: lineItem.productVariantId,
          },
        });

        const newQuantity = lineItem.physicalCount;

        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: newQuantity },
        });

        await tx.inventoryTransaction.create({
          data: {
            tenantId: context.tenantId,
            branchId: context.branchId,
            productId: lineItem.productId,
            productVariantId: lineItem.productVariantId,
            type: InventoryTransactionType.ADJUSTMENT,
            quantity: lineItem.variance,
            balanceAfter: newQuantity,
            referenceType: 'stocktake',
            referenceId: stocktakeId,
          },
        });
      }
    });

    const updated = await this.prisma.stocktake.update({
      where: { id: stocktakeId },
      data: {
        status: StocktakeStatus.APPLIED,
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'STOCKTAKE_APPLIED',
      entity: 'Stocktake',
      entityId: stocktakeId,
      metadata: {
        variances: stocktake.lineItems.filter(item => !item.variance.equals(0)).length,
      },
    });

    await this.checkAndCreateAlerts(context.tenantId);

    return updated;
  }
}
