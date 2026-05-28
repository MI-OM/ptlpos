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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../core/database/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async dashboard(tenantId, query) {
        const { start, end } = this.resolveRange(query);
        const [salesSummary, topProducts, topCustomers, completedSales, saleItems] = await Promise.all([
            this.prisma.sale.aggregate({
                where: {
                    tenantId,
                    status: client_1.SaleStatus.COMPLETED,
                    completedAt: {
                        gte: start,
                        lte: end,
                    },
                },
                _sum: {
                    totalAmount: true,
                },
                _count: {
                    id: true,
                },
            }),
            this.prisma.saleItem.groupBy({
                by: ['productId'],
                where: {
                    sale: {
                        tenantId,
                        status: client_1.SaleStatus.COMPLETED,
                        completedAt: {
                            gte: start,
                            lte: end,
                        },
                    },
                },
                _sum: {
                    quantity: true,
                    lineTotal: true,
                },
                orderBy: {
                    _sum: {
                        quantity: 'desc',
                    },
                },
                take: 5,
            }),
            this.prisma.sale.groupBy({
                by: ['customerId'],
                where: {
                    tenantId,
                    status: client_1.SaleStatus.COMPLETED,
                    customerId: {
                        not: null,
                    },
                    completedAt: {
                        gte: start,
                        lte: end,
                    },
                },
                _sum: {
                    totalAmount: true,
                },
                _count: {
                    id: true,
                },
                orderBy: {
                    _sum: {
                        totalAmount: 'desc',
                    },
                },
                take: 5,
            }),
            this.prisma.sale.findMany({
                where: {
                    tenantId,
                    status: client_1.SaleStatus.COMPLETED,
                    completedAt: {
                        gte: start,
                        lte: end,
                    },
                },
                select: {
                    completedAt: true,
                    totalAmount: true,
                },
            }),
            this.prisma.saleItem.findMany({
                where: {
                    sale: {
                        tenantId,
                        status: client_1.SaleStatus.COMPLETED,
                        completedAt: {
                            gte: start,
                            lte: end,
                        },
                    },
                },
                select: {
                    quantity: true,
                    lineTotal: true,
                    product: {
                        select: {
                            cost: true,
                        },
                    },
                },
            }),
        ]);
        const productIds = topProducts.map(entry => entry.productId);
        const customerIds = topCustomers
            .map(entry => entry.customerId)
            .filter((value) => Boolean(value));
        const [products, customers] = await Promise.all([
            productIds.length
                ? this.prisma.product.findMany({
                    where: {
                        id: {
                            in: productIds,
                        },
                    },
                    select: {
                        id: true,
                        name: true,
                    },
                })
                : Promise.resolve([]),
            customerIds.length
                ? this.prisma.customer.findMany({
                    where: {
                        tenantId,
                        id: {
                            in: customerIds,
                        },
                    },
                    select: {
                        id: true,
                        name: true,
                    },
                })
                : Promise.resolve([]),
        ]);
        const productMap = new Map(products.map(product => [product.id, product.name]));
        const customerMap = new Map(customers.map(customer => [customer.id, customer.name]));
        const revenue = Number(salesSummary._sum.totalAmount ?? 0);
        const estimatedCost = saleItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.product.cost), 0);
        const grossProfit = saleItems.reduce((sum, item) => sum + Number(item.lineTotal), 0) - estimatedCost;
        const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        return {
            range: {
                from: start.toISOString(),
                to: end.toISOString(),
            },
            dailyRevenue: salesSummary._sum.totalAmount ?? 0,
            salesCount: salesSummary._count.id,
            profitEstimate: {
                revenue,
                estimatedCost,
                grossProfit,
                grossMargin,
            },
            topProducts: topProducts.map(entry => ({
                productId: entry.productId,
                name: productMap.get(entry.productId) ?? 'Unknown',
                quantitySold: entry._sum.quantity ?? 0,
                revenue: Number(entry._sum.lineTotal ?? 0),
            })),
            topCustomers: topCustomers.map(entry => ({
                customerId: entry.customerId,
                name: entry.customerId ? (customerMap.get(entry.customerId) ?? 'Unknown') : 'Walk-in',
                totalSpent: entry._sum.totalAmount ?? 0,
                salesCount: entry._count.id,
            })),
            hourlySales: this.buildHourlyBreakdown(completedSales, start, end),
        };
    }
    resolveRange(query) {
        const start = query?.from ? new Date(query.from) : new Date();
        const end = query?.to ? new Date(query.to) : new Date();
        if (!query?.from) {
            start.setHours(0, 0, 0, 0);
        }
        if (!query?.to) {
            end.setHours(23, 59, 59, 999);
        }
        return { start, end };
    }
    buildHourlyBreakdown(sales, start, end) {
        if (start.toDateString() !== end.toDateString()) {
            return [];
        }
        const buckets = Array.from({ length: 24 }, (_, hour) => ({
            hour: hour.toString().padStart(2, '0'),
            salesCount: 0,
            revenue: 0,
        }));
        for (const sale of sales) {
            if (!sale.completedAt) {
                continue;
            }
            const hour = sale.completedAt.getHours();
            buckets[hour].salesCount += 1;
            buckets[hour].revenue += Number(sale.totalAmount);
        }
        return buckets;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map