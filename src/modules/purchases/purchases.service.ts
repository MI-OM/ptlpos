import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryTransactionType, PurchaseOrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { AuthContext } from 'src/core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { ReceivePurchaseDto } from './dto/receive-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async receive(context: AuthContext, dto: ReceivePurchaseDto) {
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
      throw new NotFoundException('Purchase order not found');
    }

    if (purchaseOrder.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('Purchase order has already been received');
    }

    if (purchaseOrder.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException('Cancelled purchase orders cannot be received');
    }

    const result = await this.prisma.$transaction(async tx => {
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
          throw new NotFoundException(`Inventory row missing for product ${item.productId}`);
        }

        const nextQuantity = new Prisma.Decimal(inventory.quantity).add(item.quantity);

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
            type: InventoryTransactionType.PURCHASE,
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
          status: PurchaseOrderStatus.RECEIVED,
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
}
