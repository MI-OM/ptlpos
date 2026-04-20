import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Export all products for tenant
   */
  async exportProducts(context: AuthContext) {
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

  /**
   * Export all customers for tenant
   */
  async exportCustomers(context: AuthContext) {
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

  /**
   * Export all suppliers for tenant
   */
  async exportSuppliers(context: AuthContext) {
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

  /**
   * Export inventory snapshot for tenant
   */
  async exportInventory(context: AuthContext, branchId?: string) {
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
}
