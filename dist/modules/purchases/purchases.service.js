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
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let PurchasesService = class PurchasesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async receive(context, dto) {
        const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
            where: {
                id: dto.purchaseOrderId,
                tenantId: context.tenantId,
                branchId: context.branchId,
            },
            include: {
                items: true,
            },
        });
        if (!purchaseOrder) {
            throw new common_1.NotFoundException('Purchase order not found');
        }
        if (purchaseOrder.status === client_1.PurchaseOrderStatus.RECEIVED) {
            throw new common_1.BadRequestException('Purchase order has already been received');
        }
        if (purchaseOrder.status === client_1.PurchaseOrderStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cancelled purchase orders cannot be received');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            for (const item of purchaseOrder.items) {
                const inventory = await tx.inventory.findFirst({
                    where: {
                        tenantId: context.tenantId,
                        branchId: context.branchId,
                        productId: item.productId,
                        productVariantId: null,
                    },
                });
                if (!inventory) {
                    throw new common_1.NotFoundException(`Inventory row missing for product ${item.productId}`);
                }
                const nextQuantity = new client_1.Prisma.Decimal(inventory.quantity).add(item.quantity);
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
                        productId: item.productId,
                        type: client_1.InventoryTransactionType.PURCHASE,
                        quantity: item.quantity,
                        balanceAfter: nextQuantity,
                        referenceType: 'purchase_order',
                        referenceId: purchaseOrder.id,
                    },
                });
            }
            return tx.purchaseOrder.update({
                where: {
                    id: purchaseOrder.id,
                },
                data: {
                    status: client_1.PurchaseOrderStatus.RECEIVED,
                },
                include: {
                    supplier: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'PURCHASE_RECEIVED',
            entity: 'PurchaseOrder',
            entityId: purchaseOrder.id,
            metadata: {
                purchaseOrderId: purchaseOrder.id,
            },
        });
        return result;
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map