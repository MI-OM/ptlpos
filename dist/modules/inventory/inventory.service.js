"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../core/database/prisma.service");
const redis_service_1 = require("../../core/database/redis.service");
const audit_service_1 = require("../audit/audit.service");
let InventoryService = class InventoryService {
    prisma;
    redis;
    audit;
    constructor(prisma, redis, audit) {
        this.prisma = prisma;
        this.redis = redis;
        this.audit = audit;
    }
    async findAll(tenantId, branchId) {
        const cacheKey = `inventory:${tenantId}:${branchId || 'all'}`;
        const cached = await this.redis.getJSON(cacheKey);
        if (cached) {
            return cached;
        }
        const inventory = await this.prisma.inventory.findMany({
            where: {
                tenantId,
                branchId,
            },
            select: {
                id: true,
                tenantId: true,
                branchId: true,
                productId: true,
                productVariantId: true,
                quantity: true,
                createdAt: true,
                updatedAt: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        type: true,
                        price: true,
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
        await this.redis.setJSON(cacheKey, inventory, 300);
        return inventory;
    }
    async lowStock(tenantId, threshold = 10, branchId) {
        return this.prisma.inventory.findMany({
            where: {
                tenantId,
                branchId,
                quantity: {
                    lte: threshold,
                },
            },
            select: {
                id: true,
                tenantId: true,
                branchId: true,
                productId: true,
                productVariantId: true,
                quantity: true,
                createdAt: true,
                updatedAt: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        type: true,
                        price: true,
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
    async history(tenantId, productId, branchId) {
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
    async valuation(tenantId, branchId) {
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
    async transfer(context, dto) {
        if (!context.branchId) {
            throw new common_1.BadRequestException('Inventory transfers require an active source branch');
        }
        if (dto.targetBranchId === context.branchId) {
            throw new common_1.BadRequestException('Target branch must be different from the source branch');
        }
        const targetBranch = await this.prisma.branch.findFirst({
            where: {
                id: dto.targetBranchId,
                tenantId: context.tenantId,
            },
        });
        if (!targetBranch) {
            throw new common_1.NotFoundException('Target branch not found');
        }
        const transferReference = `transfer_${Date.now()}`;
        const result = await this.prisma.$transaction(async (tx) => {
            const movedItems = [];
            for (const item of dto.items) {
                const quantity = new client_1.Prisma.Decimal(item.quantity);
                const sourceInventory = await tx.inventory.findFirst({
                    where: {
                        tenantId: context.tenantId,
                        branchId: context.branchId,
                        productId: item.productId,
                        productVariantId: item.productVariantId ?? null,
                    },
                });
                if (!sourceInventory) {
                    throw new common_1.NotFoundException(`Source inventory row not found for product ${item.productId}`);
                }
                const sourceNextQuantity = new client_1.Prisma.Decimal(sourceInventory.quantity).sub(quantity);
                if (sourceNextQuantity.lessThan(0)) {
                    throw new common_1.BadRequestException(`Insufficient stock for product ${item.productId}`);
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
                const targetNextQuantity = new client_1.Prisma.Decimal(targetInventory?.quantity ?? 0).add(quantity);
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
                        type: client_1.InventoryTransactionType.ADJUSTMENT,
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
                        type: client_1.InventoryTransactionType.ADJUSTMENT,
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
    async adjust(context, dto) {
        if (dto.type !== client_1.InventoryTransactionType.ADJUSTMENT &&
            dto.type !== client_1.InventoryTransactionType.OPENING &&
            dto.type !== client_1.InventoryTransactionType.PURCHASE &&
            dto.type !== client_1.InventoryTransactionType.PRODUCTION) {
            throw new common_1.BadRequestException('Manual adjust only supports opening, purchase, production, or adjustment');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const inventory = await tx.inventory.findFirst({
                where: {
                    tenantId: context.tenantId,
                    branchId: context.branchId,
                    productId: dto.productId,
                    productVariantId: dto.productVariantId ?? null,
                },
            });
            if (!inventory) {
                throw new common_1.NotFoundException('Inventory row not found');
            }
            const nextQuantity = new client_1.Prisma.Decimal(inventory.quantity).add(dto.quantity);
            if (nextQuantity.lessThan(0)) {
                throw new common_1.BadRequestException('Inventory cannot go below zero');
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
            metadata: dto,
        });
        await this.checkAndCreateAlerts(context.tenantId);
        await this.redis.invalidatePattern(`inventory:${context.tenantId}:*`);
        return result;
    }
    async getAlerts(tenantId, resolved = false) {
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
    async checkAndCreateAlerts(tenantId, threshold = 10) {
        if (threshold < 0) {
            throw new common_1.BadRequestException('Threshold must be zero or greater');
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
        const currentLowStockKeys = new Set(lowStockItems.map(item => `${item.productId}:${item.productVariantId ?? ''}`));
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
        const createdAlerts = await Promise.all(lowStockItems.map(async (item) => {
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
        }));
        return createdAlerts;
    }
    async resolveAlert(tenantId, alertId) {
        const alert = await this.prisma.lowStockAlert.findFirst({
            where: {
                id: alertId,
                tenantId,
            },
        });
        if (!alert) {
            throw new common_1.NotFoundException('Alert not found');
        }
        return this.prisma.lowStockAlert.update({
            where: { id: alertId },
            data: {
                isResolved: true,
                resolvedAt: new Date(),
            },
        });
    }
    async createStocktake(context, dto) {
        const stocktake = await this.prisma.stocktake.create({
            data: {
                tenantId: context.tenantId,
                name: dto.name,
                notes: dto.notes,
                status: client_1.StocktakeStatus.PLANNED,
            },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'STOCKTAKE_CREATED',
            entity: 'Stocktake',
            entityId: stocktake.id,
            metadata: {
                status: client_1.StocktakeStatus.PLANNED,
            },
        });
        return stocktake;
    }
    async startStocktake(context, stocktakeId) {
        const stocktake = await this.prisma.stocktake.findFirst({
            where: {
                id: stocktakeId,
                tenantId: context.tenantId,
            },
        });
        if (!stocktake) {
            throw new common_1.NotFoundException('Stocktake not found');
        }
        if (stocktake.status !== client_1.StocktakeStatus.PLANNED) {
            throw new common_1.BadRequestException('Can only start planned stocktakes');
        }
        const updated = await this.prisma.stocktake.update({
            where: { id: stocktakeId },
            data: {
                status: client_1.StocktakeStatus.IN_PROGRESS,
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
    async cancelStocktake(context, stocktakeId) {
        const stocktake = await this.prisma.stocktake.findFirst({
            where: {
                id: stocktakeId,
                tenantId: context.tenantId,
            },
        });
        if (!stocktake) {
            throw new common_1.NotFoundException('Stocktake not found');
        }
        const cancellableStatuses = [
            client_1.StocktakeStatus.PLANNED,
            client_1.StocktakeStatus.IN_PROGRESS,
        ];
        if (!cancellableStatuses.includes(stocktake.status)) {
            throw new common_1.BadRequestException('Only planned or in-progress stocktakes can be cancelled');
        }
        const updated = await this.prisma.stocktake.update({
            where: { id: stocktakeId },
            data: {
                status: client_1.StocktakeStatus.CANCELLED,
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
    async recordStocktakeCounts(context, stocktakeId, dto) {
        const stocktake = await this.prisma.stocktake.findFirst({
            where: {
                id: stocktakeId,
                tenantId: context.tenantId,
            },
        });
        if (!stocktake) {
            throw new common_1.NotFoundException('Stocktake not found');
        }
        if (stocktake.status !== client_1.StocktakeStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Stocktake must be in progress to record counts');
        }
        const lineItems = await this.prisma.$transaction(dto.items.map(item => this.prisma.stocktakeLineItem.upsert({
            where: {
                unique_stocktake_item: {
                    stocktakeId,
                    productId: item.productId,
                    productVariantId: item.productVariantId ?? null,
                },
            },
            update: {
                physicalCount: new client_1.Prisma.Decimal(item.physicalCount),
                notes: item.notes,
            },
            create: {
                stocktakeId,
                productId: item.productId,
                productVariantId: item.productVariantId,
                systemCount: new client_1.Prisma.Decimal(0),
                physicalCount: new client_1.Prisma.Decimal(item.physicalCount),
                variance: new client_1.Prisma.Decimal(0),
                notes: item.notes,
            },
            include: {
                product: true,
                productVariant: true,
            },
        })));
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
    async completeStocktake(context, stocktakeId) {
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
            throw new common_1.NotFoundException('Stocktake not found');
        }
        if (stocktake.status !== client_1.StocktakeStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Only in-progress stocktakes can be completed');
        }
        if (stocktake.lineItems.length === 0) {
            throw new common_1.BadRequestException('Cannot complete a stocktake without recorded counts');
        }
        await Promise.all(stocktake.lineItems.map(async (item) => {
            const inventory = await this.prisma.inventory.findFirst({
                where: {
                    tenantId: context.tenantId,
                    branchId: context.branchId,
                    productId: item.productId,
                    productVariantId: item.productVariantId,
                },
            });
            const systemCount = inventory?.quantity ?? new client_1.Prisma.Decimal(0);
            const variance = new client_1.Prisma.Decimal(item.physicalCount).minus(systemCount);
            return this.prisma.stocktakeLineItem.update({
                where: { id: item.id },
                data: {
                    systemCount,
                    variance,
                },
            });
        }));
        const updated = await this.prisma.stocktake.update({
            where: { id: stocktakeId },
            data: {
                status: client_1.StocktakeStatus.COMPLETED,
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
    async getStocktake(tenantId, stocktakeId) {
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
    async listStocktakes(tenantId, status) {
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
    async applyStocktakeAdjustments(context, stocktakeId) {
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
            throw new common_1.NotFoundException('Stocktake not found');
        }
        if (stocktake.status !== client_1.StocktakeStatus.COMPLETED) {
            throw new common_1.BadRequestException('Only completed stocktakes can be applied');
        }
        await this.prisma.$transaction(async (tx) => {
            for (const lineItem of stocktake.lineItems) {
                if (lineItem.variance.equals(0)) {
                    continue;
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
                        type: client_1.InventoryTransactionType.ADJUSTMENT,
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
                status: client_1.StocktakeStatus.APPLIED,
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
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        audit_service_1.AuditService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map