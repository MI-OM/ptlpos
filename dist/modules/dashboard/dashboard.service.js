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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(context) {
        const [totalCustomers, totalProducts, totalSales, totalRevenue, todaySales, todayRevenue, activeShifts, lowStockCount,] = await Promise.all([
            this.prisma.customer.count({
                where: { tenantId: context.tenantId },
            }),
            this.prisma.product.count({
                where: { tenantId: context.tenantId },
            }),
            this.prisma.sale.count({
                where: {
                    tenantId: context.tenantId,
                    status: 'COMPLETED',
                },
            }),
            this.prisma.sale.aggregate({
                where: {
                    tenantId: context.tenantId,
                    status: 'COMPLETED',
                },
                _sum: {
                    totalAmount: true,
                },
            }),
            this.prisma.sale.count({
                where: {
                    tenantId: context.tenantId,
                    status: 'COMPLETED',
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
            this.prisma.sale.aggregate({
                where: {
                    tenantId: context.tenantId,
                    status: 'COMPLETED',
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
                _sum: {
                    totalAmount: true,
                },
            }),
            this.prisma.shift.count({
                where: {
                    tenantId: context.tenantId,
                    status: 'OPEN',
                },
            }),
            this.prisma.lowStockAlert.count({
                where: {
                    tenantId: context.tenantId,
                    isResolved: false,
                },
            }),
        ]);
        return {
            customers: totalCustomers,
            products: totalProducts,
            sales: {
                total: totalSales,
                today: todaySales,
            },
            revenue: {
                total: Number(totalRevenue._sum.totalAmount || 0),
                today: Number(todayRevenue._sum.totalAmount || 0),
            },
            activeShifts,
            lowStockAlerts: lowStockCount,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map