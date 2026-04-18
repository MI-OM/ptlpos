import { NotFoundException } from '@nestjs/common';
import { PurchaseOrderStatus } from '@prisma/client';
import { PurchaseOrdersService } from 'src/modules/purchase-orders/purchase-orders.service';

describe('PurchaseOrdersService', () => {
  const context = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    role: 'ADMIN',
  } as const;

  let prisma: {
    supplier: { findFirst: jest.Mock };
    product: { findMany: jest.Mock };
    purchaseOrder: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock };
  };
  let audit: { log: jest.Mock };
  let service: PurchaseOrdersService;

  beforeEach(() => {
    prisma = {
      supplier: { findFirst: jest.fn() },
      product: { findMany: jest.fn() },
      purchaseOrder: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    };
    audit = { log: jest.fn() };
    service = new PurchaseOrdersService(prisma as never, audit as never);
  });

  it('rejects creation when supplier does not belong to tenant', async () => {
    prisma.supplier.findFirst.mockResolvedValue(null);

    await expect(
      service.create(context, {
        supplierId: 'supplier-1',
        items: [{ productId: 'product-1', quantity: 2, cost: 5 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects creation when any product is missing', async () => {
    prisma.supplier.findFirst.mockResolvedValue({ id: 'supplier-1' });
    prisma.product.findMany.mockResolvedValue([]);

    await expect(
      service.create(context, {
        supplierId: 'supplier-1',
        items: [{ productId: 'product-1', quantity: 2, cost: 5 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a purchase order with line items', async () => {
    prisma.supplier.findFirst.mockResolvedValue({ id: 'supplier-1' });
    prisma.product.findMany.mockResolvedValue([{ id: 'product-1' }]);
    prisma.purchaseOrder.create.mockResolvedValue({
      id: 'po-1',
      status: PurchaseOrderStatus.DRAFT,
      items: [{ productId: 'product-1', quantity: 2, cost: 5 }],
    });

    const result = await service.create(context, {
      supplierId: 'supplier-1',
      items: [{ productId: 'product-1', quantity: 2, cost: 5 }],
    });

    expect(prisma.purchaseOrder.create).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalled();
    expect(result.id).toBe('po-1');
  });
});
