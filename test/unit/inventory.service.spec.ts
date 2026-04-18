import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryTransactionType, Prisma, StocktakeStatus } from '@prisma/client';
import { InventoryService } from 'src/modules/inventory/inventory.service';

describe('InventoryService', () => {
  const context = {
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    userId: 'user-1',
    role: 'ADMIN',
  } as const;

  let prisma: {
    $transaction: jest.Mock;
    inventory: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    branch: {
      findFirst: jest.Mock;
    };
    lowStockAlert: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    stocktake: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
    stocktakeLineItem: {
      update: jest.Mock;
    };
  };
  let audit: {
    log: jest.Mock;
  };
  let service: InventoryService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      inventory: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      branch: {
        findFirst: jest.fn(),
      },
      lowStockAlert: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      stocktake: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      stocktakeLineItem: {
        update: jest.fn(),
      },
    };
    audit = {
      log: jest.fn(),
    };

    service = new InventoryService(prisma as never, audit as never);
  });

  it('rejects unsupported manual transaction types', async () => {
    await expect(
      service.adjust(context, {
        productId: 'product-1',
        quantity: 1,
        type: InventoryTransactionType.SALE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects transfers when there is no active source branch', async () => {
    await expect(
      service.transfer(
        {
          tenantId: 'tenant-1',
          userId: 'user-1',
          role: 'ADMIN',
        } as any,
        {
          targetBranchId: 'branch-2',
          items: [{ productId: 'product-1', quantity: 1 }],
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects transfers to the same branch', async () => {
    await expect(
      service.transfer(context, {
        targetBranchId: 'branch-1',
        items: [{ productId: 'product-1', quantity: 1 }],
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transfers inventory between branches and writes ledger entries', async () => {
    jest.spyOn(service, 'checkAndCreateAlerts').mockResolvedValue([]);
    prisma.branch.findFirst.mockResolvedValue({
      id: 'branch-2',
      tenantId: 'tenant-1',
    });

    const inventoryFindFirst = jest
      .fn()
      .mockResolvedValueOnce({
        id: 'source-inventory-1',
        quantity: new Prisma.Decimal(5),
      })
      .mockResolvedValueOnce({
        id: 'target-inventory-1',
        quantity: new Prisma.Decimal(1),
      });
    const inventoryUpdate = jest
      .fn()
      .mockResolvedValueOnce({
        id: 'source-inventory-1',
        quantity: new Prisma.Decimal(3),
      })
      .mockResolvedValueOnce({
        id: 'target-inventory-1',
        quantity: new Prisma.Decimal(3),
      });
    const inventoryTransactionCreate = jest.fn();

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        inventory: {
          findFirst: inventoryFindFirst,
          update: inventoryUpdate,
          create: jest.fn(),
        },
        inventoryTransaction: {
          create: inventoryTransactionCreate,
        },
      })
    );

    const result = await service.transfer(context, {
      targetBranchId: 'branch-2',
      note: 'Rebalance stock',
      items: [{ productId: 'product-1', quantity: 2 }],
    });

    expect(prisma.branch.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'branch-2',
        tenantId: 'tenant-1',
      },
    });
    expect(inventoryFindFirst).toHaveBeenNthCalledWith(1, {
      where: {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        productId: 'product-1',
        productVariantId: null,
      },
    });
    expect(inventoryFindFirst).toHaveBeenNthCalledWith(2, {
      where: {
        tenantId: 'tenant-1',
        branchId: 'branch-2',
        productId: 'product-1',
        productVariantId: null,
      },
    });
    expect(inventoryTransactionCreate).toHaveBeenCalledTimes(2);
    expect(inventoryTransactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          branchId: 'branch-1',
          referenceType: 'inventory_transfer_out',
        }),
      })
    );
    expect(inventoryTransactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          branchId: 'branch-2',
          referenceType: 'inventory_transfer_in',
        }),
      })
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'INVENTORY_TRANSFERRED',
        entity: 'InventoryTransfer',
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        sourceBranchId: 'branch-1',
        targetBranchId: 'branch-2',
        itemCount: 1,
        items: [
          expect.objectContaining({
            productId: 'product-1',
            quantity: new Prisma.Decimal(2),
          }),
        ],
      })
    );
  });

  it('returns low-stock inventory rows using the provided threshold', async () => {
    prisma.inventory.findMany.mockResolvedValue([
      { id: 'inventory-1', quantity: new Prisma.Decimal(2) },
    ]);

    const result = await service.lowStock('tenant-1', 5);

    expect(prisma.inventory.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        branchId: undefined,
        quantity: {
          lte: 5,
        },
      },
      include: {
        product: true,
        productVariant: true,
      },
      orderBy: [
        {
          quantity: 'asc',
        },
        {
          updatedAt: 'desc',
        },
      ],
    });
    expect(result).toEqual([{ id: 'inventory-1', quantity: new Prisma.Decimal(2) }]);
  });

  it('returns an inventory valuation summary using standard cost', async () => {
    prisma.inventory.findMany.mockResolvedValue([
      {
        id: 'inventory-1',
        productId: 'product-1',
        productVariantId: null,
        quantity: new Prisma.Decimal(3),
        product: {
          id: 'product-1',
          name: 'Bread',
          sku: 'BRD-001',
          cost: new Prisma.Decimal(10),
        },
        productVariant: null,
      },
      {
        id: 'inventory-2',
        productId: 'product-2',
        productVariantId: 'variant-1',
        quantity: new Prisma.Decimal(2.5),
        product: {
          id: 'product-2',
          name: 'Cake',
          sku: 'CKE-001',
          cost: new Prisma.Decimal(8),
        },
        productVariant: {
          id: 'variant-1',
          name: 'Large',
          sku: 'CKE-L',
        },
      },
    ]);

    const result = await service.valuation('tenant-1', 'branch-1');

    expect(prisma.inventory.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            cost: true,
          },
        },
        productVariant: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    expect(result).toEqual({
      branchId: 'branch-1',
      valuationMethod: 'STANDARD_COST',
      totals: {
        quantity: 5.5,
        stockValue: 50,
        itemCount: 2,
      },
      items: [
        {
          inventoryId: 'inventory-1',
          productId: 'product-1',
          productVariantId: null,
          productName: 'Bread',
          variantName: null,
          sku: 'BRD-001',
          quantity: 3,
          unitCost: 10,
          stockValue: 30,
        },
        {
          inventoryId: 'inventory-2',
          productId: 'product-2',
          productVariantId: 'variant-1',
          productName: 'Cake',
          variantName: 'Large',
          sku: 'CKE-L',
          quantity: 2.5,
          unitCost: 8,
          stockValue: 20,
        },
      ],
    });
  });

  it('rejects negative resulting inventory', async () => {
    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        inventory: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'inventory-1',
            quantity: new Prisma.Decimal(2),
          }),
        },
      }),
    );

    await expect(
      service.adjust(context, {
        productId: 'product-1',
        quantity: -3,
        type: InventoryTransactionType.ADJUSTMENT,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when the inventory row is missing', async () => {
    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        inventory: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      }),
    );

    await expect(
      service.adjust(context, {
        productId: 'product-1',
        quantity: 2,
        type: InventoryTransactionType.ADJUSTMENT,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates the inventory snapshot and writes the ledger entry', async () => {
    jest.spyOn(service, 'checkAndCreateAlerts').mockResolvedValue([]);
    const findFirst = jest.fn().mockResolvedValue({
      id: 'inventory-1',
      quantity: new Prisma.Decimal(5),
    });
    const update = jest.fn().mockResolvedValue({ id: 'inventory-1', quantity: new Prisma.Decimal(7) });
    const create = jest.fn().mockResolvedValue({ id: 'txn-1' });

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        inventory: {
          findFirst,
          update,
        },
        inventoryTransaction: {
          create,
        },
      }),
    );

    const result = await service.adjust(context, {
      productId: 'product-1',
      quantity: 2,
      type: InventoryTransactionType.ADJUSTMENT,
      note: 'restock',
    });

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        productId: 'product-1',
        productVariantId: null,
      },
    });
    expect(update).toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          productId: 'product-1',
          quantity: 2,
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalled();
    expect(result).toEqual({ id: 'inventory-1', quantity: new Prisma.Decimal(7) });
  });

  it('creates or refreshes low-stock alerts and resolves stale ones', async () => {
    jest.spyOn(service, 'lowStock').mockResolvedValue([
      {
        productId: 'product-1',
        productVariantId: null,
        quantity: new Prisma.Decimal(2),
      },
    ] as never);

    prisma.lowStockAlert.findMany.mockResolvedValue([
      {
        id: 'alert-stale',
        productId: 'product-2',
        productVariantId: null,
      },
    ]);
    prisma.lowStockAlert.findFirst.mockResolvedValue(null);
    prisma.lowStockAlert.create.mockResolvedValue({
      id: 'alert-1',
      productId: 'product-1',
      quantity: new Prisma.Decimal(2),
    });

    const result = await service.checkAndCreateAlerts('tenant-1', 5);

    expect(prisma.lowStockAlert.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['alert-stale'],
        },
      },
      data: {
        isResolved: true,
        resolvedAt: expect.any(Date),
      },
    });
    expect(prisma.lowStockAlert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          productId: 'product-1',
        }),
      })
    );
    expect(result).toEqual([
      {
        id: 'alert-1',
        productId: 'product-1',
        quantity: new Prisma.Decimal(2),
      },
    ]);
  });

  it('resolves all unresolved alerts when stock is no longer low', async () => {
    jest.spyOn(service, 'lowStock').mockResolvedValue([]);
    prisma.lowStockAlert.findMany.mockResolvedValue([{ id: 'alert-1' }]);

    const result = await service.checkAndCreateAlerts('tenant-1', 10);

    expect(prisma.lowStockAlert.updateMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        isResolved: false,
      },
      data: {
        isResolved: true,
        resolvedAt: expect.any(Date),
      },
    });
    expect(result).toEqual([]);
  });

  it('rejects negative alert thresholds', async () => {
    await expect(service.checkAndCreateAlerts('tenant-1', -1)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('resolves a single alert by id', async () => {
    prisma.lowStockAlert.findFirst.mockResolvedValue({
      id: 'alert-1',
      tenantId: 'tenant-1',
    });
    prisma.lowStockAlert.update.mockResolvedValue({
      id: 'alert-1',
      isResolved: true,
    });

    const result = await service.resolveAlert('tenant-1', 'alert-1');

    expect(prisma.lowStockAlert.update).toHaveBeenCalledWith({
      where: { id: 'alert-1' },
      data: {
        isResolved: true,
        resolvedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      id: 'alert-1',
      isResolved: true,
    });
  });

  it('creates a planned stocktake and writes an audit log', async () => {
    prisma.stocktake.create.mockResolvedValue({
      id: 'stocktake-1',
      tenantId: 'tenant-1',
      name: 'Weekly Count',
      status: StocktakeStatus.PLANNED,
    });

    const result = await service.createStocktake(context, {
      name: 'Weekly Count',
      notes: 'Front shelf',
    });

    expect(prisma.stocktake.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        name: 'Weekly Count',
        notes: 'Front shelf',
        status: StocktakeStatus.PLANNED,
      },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STOCKTAKE_CREATED',
        entityId: 'stocktake-1',
      })
    );
    expect(result).toEqual({
      id: 'stocktake-1',
      tenantId: 'tenant-1',
      name: 'Weekly Count',
      status: StocktakeStatus.PLANNED,
    });
  });

  it('starts a planned stocktake', async () => {
    prisma.stocktake.findFirst.mockResolvedValue({
      id: 'stocktake-1',
      status: StocktakeStatus.PLANNED,
    });
    prisma.stocktake.update.mockResolvedValue({
      id: 'stocktake-1',
      status: StocktakeStatus.IN_PROGRESS,
    });

    const result = await service.startStocktake(context, 'stocktake-1');

    expect(prisma.stocktake.update).toHaveBeenCalledWith({
      where: { id: 'stocktake-1' },
      data: {
        status: StocktakeStatus.IN_PROGRESS,
        startedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      id: 'stocktake-1',
      status: StocktakeStatus.IN_PROGRESS,
    });
  });

  it('cancels an in-progress stocktake', async () => {
    prisma.stocktake.findFirst.mockResolvedValue({
      id: 'stocktake-1',
      status: StocktakeStatus.IN_PROGRESS,
    });
    prisma.stocktake.update.mockResolvedValue({
      id: 'stocktake-1',
      status: StocktakeStatus.CANCELLED,
    });

    const result = await service.cancelStocktake(context, 'stocktake-1');

    expect(prisma.stocktake.update).toHaveBeenCalledWith({
      where: { id: 'stocktake-1' },
      data: {
        status: StocktakeStatus.CANCELLED,
      },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STOCKTAKE_CANCELLED',
        entityId: 'stocktake-1',
      })
    );
    expect(result).toEqual({
      id: 'stocktake-1',
      status: StocktakeStatus.CANCELLED,
    });
  });

  it('rejects completing a stocktake without recorded counts', async () => {
    prisma.stocktake.findFirst.mockResolvedValue({
      id: 'stocktake-1',
      status: StocktakeStatus.IN_PROGRESS,
      lineItems: [],
    });

    await expect(service.completeStocktake(context, 'stocktake-1')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('completes a stocktake by calculating system counts and variances', async () => {
    prisma.stocktake.findFirst.mockResolvedValue({
      id: 'stocktake-1',
      status: StocktakeStatus.IN_PROGRESS,
      lineItems: [
        {
          id: 'line-1',
          productId: 'product-1',
          productVariantId: null,
          physicalCount: new Prisma.Decimal(3),
        },
      ],
    });
    prisma.inventory.findFirst.mockResolvedValue({
      id: 'inventory-1',
      quantity: new Prisma.Decimal(5),
    });
    prisma.stocktakeLineItem.update.mockResolvedValue({
      id: 'line-1',
      variance: new Prisma.Decimal(-2),
    });
    prisma.stocktake.update.mockResolvedValue({
      id: 'stocktake-1',
      status: StocktakeStatus.COMPLETED,
      lineItems: [{ id: 'line-1' }],
    });

    const result = await service.completeStocktake(context, 'stocktake-1');

    expect(prisma.inventory.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        productId: 'product-1',
        productVariantId: null,
      },
    });
    expect(prisma.stocktakeLineItem.update).toHaveBeenCalledWith({
      where: { id: 'line-1' },
      data: {
        systemCount: new Prisma.Decimal(5),
        variance: new Prisma.Decimal(-2),
      },
    });
    expect(result).toEqual({
      id: 'stocktake-1',
      status: StocktakeStatus.COMPLETED,
      lineItems: [{ id: 'line-1' }],
    });
  });
});
