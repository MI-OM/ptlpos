import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PurchaseOrderStatus } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { AuthContext } from 'src/core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  findAll(tenantId: string, branchId?: string) {
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

  async findOne(tenantId: string, id: string, branchId?: string) {
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
      throw new NotFoundException('Purchase order not found');
    }

    return purchaseOrder;
  }

  async create(context: AuthContext, dto: CreatePurchaseOrderDto) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: dto.supplierId,
        tenantId: context.tenantId,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
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
      throw new NotFoundException('One or more products were not found');
    }

    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        tenantId: context.tenantId,
        branchId: context.branchId,
        supplierId: dto.supplierId,
        status: dto.status ?? PurchaseOrderStatus.DRAFT,
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
      metadata: dto as unknown as Prisma.JsonObject,
    });

    return purchaseOrder;
  }
}
