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
exports.ExportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
let ExportsService = class ExportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exportProducts(context) {
        const products = await this.prisma.product.findMany({
            where: { tenantId: context.tenantId },
            select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                cost: true,
                taxRate: true,
                type: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            count: products.length,
            data: products,
            exportedAt: new Date().toISOString(),
        };
    }
    async exportCustomers(context) {
        const customers = await this.prisma.customer.findMany({
            where: { tenantId: context.tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            count: customers.length,
            data: customers,
            exportedAt: new Date().toISOString(),
        };
    }
    async exportSuppliers(context) {
        const suppliers = await this.prisma.supplier.findMany({
            where: { tenantId: context.tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            count: suppliers.length,
            data: suppliers,
            exportedAt: new Date().toISOString(),
        };
    }
    async exportSales(context, from, to, branchId) {
        const where = { tenantId: context.tenantId };
        if (branchId) {
            where.branchId = branchId;
        }
        if (from || to) {
            where.createdAt = {};
            if (from)
                where.createdAt.gte = new Date(from);
            if (to)
                where.createdAt.lte = new Date(to);
        }
        const sales = await this.prisma.sale.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: {
                            select: { name: true, sku: true },
                        },
                    },
                },
                payments: true,
                customer: {
                    select: { name: true, email: true },
                },
                shift: {
                    include: {
                        user: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            count: sales.length,
            data: sales,
            exportedAt: new Date().toISOString(),
        };
    }
    async exportInventory(context, branchId) {
        const inventory = await this.prisma.inventory.findMany({
            where: {
                tenantId: context.tenantId,
                branchId,
            },
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        return {
            success: true,
            count: inventory.length,
            data: inventory,
            exportedAt: new Date().toISOString(),
        };
    }
};
exports.ExportsService = ExportsService;
exports.ExportsService = ExportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportsService);
//# sourceMappingURL=exports.service.js.map