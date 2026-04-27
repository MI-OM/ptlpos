import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(context: AuthContext) {
    const [
      totalCustomers,
      totalProducts,
      totalSales,
      totalRevenue,
      todaySales,
      todayRevenue,
      activeShifts,
      lowStockCount,
    ] = await Promise.all([
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
}
