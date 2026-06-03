import { Injectable } from '@nestjs/common';
import { SaleStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(
    tenantId: string,
    query?: {
      from?: string;
      to?: string;
    }
  ) {
    const { start, end } = this.resolveRange(query);

    const [salesSummary, topProducts, topCustomers, completedSales, saleItems] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          tenantId,
          status: SaleStatus.COMPLETED,
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
            status: SaleStatus.COMPLETED,
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
          status: SaleStatus.COMPLETED,
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
          status: SaleStatus.COMPLETED,
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
            status: SaleStatus.COMPLETED,
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
      .filter((value): value is string => Boolean(value));

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
    const estimatedCost = saleItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.product.cost),
      0
    );
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

  private resolveRange(query?: { from?: string; to?: string }) {
    const start = query?.from ? new Date(query.from) : new Date();
    const end = query?.to ? new Date(query.to) : new Date();

    if (!query?.from) {
      start.setHours(0, 0, 0, 0);
    }

    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  private buildHourlyBreakdown(
    sales: Array<{
      completedAt: Date | null;
      totalAmount: unknown;
    }>,
    start: Date,
    end: Date
  ) {
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
}
