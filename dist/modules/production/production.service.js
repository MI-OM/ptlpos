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
exports.ProductionService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let ProductionService = class ProductionService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async run(context, dto) {
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
            throw new common_1.NotFoundException('Recipe not found for this product');
        }
        const result = await this.prisma.$transaction(async (tx) => {
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
                    throw new common_1.NotFoundException(`Inventory row missing for raw material ${item.rawMaterialId}`);
                }
                const requiredQuantity = new client_1.Prisma.Decimal(item.quantity).mul(dto.quantityProduced);
                const nextQuantity = new client_1.Prisma.Decimal(inventory.quantity).sub(requiredQuantity);
                if (nextQuantity.lessThan(0)) {
                    throw new common_1.ConflictException(`Insufficient stock for raw material ${item.rawMaterialId}`);
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
                        type: client_1.InventoryTransactionType.PRODUCTION,
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
                throw new common_1.NotFoundException(`Inventory row missing for finished product ${recipe.productId}`);
            }
            const finishedQuantity = new client_1.Prisma.Decimal(finishedGoodsInventory.quantity).add(dto.quantityProduced);
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
                    type: client_1.InventoryTransactionType.PRODUCTION,
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
            metadata: dto,
        });
        return result;
    }
    async getOrders(context) {
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
    async getRecipes(context) {
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
                return sum.add(new client_1.Prisma.Decimal(item.rawMaterial.cost || 0).mul(item.quantity));
            }, new client_1.Prisma.Decimal(0));
            const productPrice = new client_1.Prisma.Decimal(recipe.product.price || 0);
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
                    totalCost: new client_1.Prisma.Decimal(item.rawMaterial.cost || 0).mul(item.quantity).toNumber(),
                })),
            };
        });
    }
    async getMaterials(context) {
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
    async getMachines(context) {
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
};
exports.ProductionService = ProductionService;
exports.ProductionService = ProductionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ProductionService);
//# sourceMappingURL=production.service.js.map