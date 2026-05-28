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
exports.PurchaseOrdersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let PurchaseOrdersService = class PurchaseOrdersService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    findAll(tenantId, branchId) {
        return this.prisma.purchaseOrder.findMany({
            where: { tenantId, branchId },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(tenantId, id, branchId) {
        const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
            where: {
                id,
                tenantId,
                branchId,
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
        if (!purchaseOrder) {
            throw new common_1.NotFoundException('Purchase order not found');
        }
        return purchaseOrder;
    }
    async create(context, dto) {
        const supplier = await this.prisma.supplier.findFirst({
            where: {
                id: dto.supplierId,
                tenantId: context.tenantId,
            },
        });
        if (!supplier) {
            throw new common_1.NotFoundException('Supplier not found');
        }
        const products = await this.prisma.product.findMany({
            where: {
                tenantId: context.tenantId,
                id: {
                    in: dto.items.map(item => item.productId),
                },
            },
            select: {
                id: true,
            },
        });
        if (products.length !== dto.items.length) {
            throw new common_1.NotFoundException('One or more products were not found');
        }
        const purchaseOrder = await this.prisma.purchaseOrder.create({
            data: {
                tenantId: context.tenantId,
                branchId: context.branchId,
                supplierId: dto.supplierId,
                status: dto.status ?? client_1.PurchaseOrderStatus.DRAFT,
                items: {
                    create: dto.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        cost: item.cost,
                    })),
                },
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
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'PURCHASE_ORDER_CREATED',
            entity: 'PurchaseOrder',
            entityId: purchaseOrder.id,
            metadata: dto,
        });
        return purchaseOrder;
    }
};
exports.PurchaseOrdersService = PurchaseOrdersService;
exports.PurchaseOrdersService = PurchaseOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], PurchaseOrdersService);
//# sourceMappingURL=purchase-orders.service.js.map