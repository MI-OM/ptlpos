import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryTransactionType, Prisma, PurchaseOrderStatus } from '@prisma/client';
import { PurchasesService } from 'src/modules/purchases/purchases.service';

describe('PurchasesService', () => {
  const context = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    role: 'ADMIN',
  } as const;

  let prisma: {
    purchaseOrder: {
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let audit: { log: jest.Mock };
  let service: PurchasesService;

  beforeEach(() => {
    prisma = {
      purchaseOrder: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    audit = { log: jest.fn() };
    service = new PurchasesService(prisma as never, audit as never);
  });

  it('throws when purchase order is missing', async () => {
    prisma.purchaseOrder.findFirst.mockResolvedValue(null);

    await expect(
      service.receive(context, {
        purchaseOrderId: 'po-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects already received purchase orders', async () => {
    prisma.purchaseOrder.findFirst.mockResolvedValue({
      id: 'po-1',
      status: PurchaseOrderStatus.RECEIVED,
      items: [],
    });

    await expect(
      service.receive(context, {
        purchaseOrderId: 'po-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('receives a purchase order and writes purchase inventory transactions', async () => {
    prisma.purchaseOrder.findFirst.mockResolvedValue({
      id: 'po-1',
      status: PurchaseOrderStatus.DRAFT,
      items: [
        {
          productId: 'product-1',
          quantity: new Prisma.Decimal(5),
        },
      ],
    });

    const inventoryUpdate = jest.fn();
    const inventoryTransactionCreate = jest.fn();
    const purchaseOrderUpdate = jest.fn().mockResolvedValue({
      id: 'po-1',
      status: PurchaseOrderStatus.RECEIVED,
    });

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        inventory: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'inventory-1',
            quantity: new Prisma.Decimal(3),
          }),
          update: inventoryUpdate,
        },
        inventoryTransaction: {
          create: inventoryTransactionCreate,
        },
        purchaseOrder: {
          update: purchaseOrderUpdate,
        },
      }),
    );

    const result = await service.receive(context, {
      purchaseOrderId: 'po-1',
    });

    expect(inventoryUpdate).toHaveBeenCalled();
    expect(inventoryTransactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: InventoryTransactionType.PURCHASE,
          referenceType: 'purchase_order',
          referenceId: 'po-1',
        }),
      }),
    );
    expect(purchaseOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: PurchaseOrderStatus.RECEIVED,
        },
      }),
    );
    expect(audit.log).toHaveBeenCalled();
    expect(result).toEqual({
      id: 'po-1',
      status: PurchaseOrderStatus.RECEIVED,
    });
  });
});
