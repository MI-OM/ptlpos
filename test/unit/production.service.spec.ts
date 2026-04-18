import { ConflictException, NotFoundException } from '@nestjs/common';
import { InventoryTransactionType, Prisma } from '@prisma/client';
import { ProductionService } from 'src/modules/production/production.service';

describe('ProductionService', () => {
  const context = {
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    userId: 'user-1',
    role: 'ADMIN',
  } as const;

  let prisma: {
    recipe: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { log: jest.Mock };
  let service: ProductionService;

  beforeEach(() => {
    prisma = {
      recipe: { findFirst: jest.fn() },
      $transaction: jest.fn(),
    };
    audit = { log: jest.fn() };
    service = new ProductionService(prisma as never, audit as never);
  });

  it('throws when no recipe exists for the product', async () => {
    prisma.recipe.findFirst.mockResolvedValue(null);

    await expect(
      service.run(context, {
        productId: 'product-1',
        quantityProduced: 2,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when raw material stock is insufficient', async () => {
    prisma.recipe.findFirst.mockResolvedValue({
      productId: 'product-1',
      items: [{ rawMaterialId: 'raw-1', quantity: new Prisma.Decimal(2) }],
      product: { id: 'product-1' },
    });

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        inventory: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'inventory-raw-1',
            quantity: new Prisma.Decimal(1),
          }),
        },
      }),
    );

    await expect(
      service.run(context, {
        productId: 'product-1',
        quantityProduced: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates a production batch and writes production inventory transactions', async () => {
    prisma.recipe.findFirst.mockResolvedValue({
      productId: 'product-1',
      items: [{ rawMaterialId: 'raw-1', quantity: new Prisma.Decimal(2) }],
      product: { id: 'product-1' },
    });

    const inventoryFindFirst = jest
      .fn()
      .mockResolvedValueOnce({
        id: 'inventory-raw-1',
        quantity: new Prisma.Decimal(10),
      })
      .mockResolvedValueOnce({
        id: 'inventory-fg-1',
        quantity: new Prisma.Decimal(3),
      });
    const inventoryUpdate = jest.fn();
    const inventoryTransactionCreate = jest.fn();
    const productionBatchCreate = jest.fn().mockResolvedValue({ id: 'batch-1' });

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        inventory: {
          findFirst: inventoryFindFirst,
          update: inventoryUpdate,
        },
        inventoryTransaction: {
          create: inventoryTransactionCreate,
        },
        productionBatch: {
          create: productionBatchCreate,
          findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'batch-1' }),
        },
      }),
    );

    const result = await service.run(context, {
      productId: 'product-1',
      quantityProduced: 2,
    });

    expect(inventoryFindFirst).toHaveBeenNthCalledWith(1, {
      where: {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        productId: 'raw-1',
        productVariantId: null,
      },
    });
    expect(inventoryFindFirst).toHaveBeenNthCalledWith(2, {
      where: {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        productId: 'product-1',
        productVariantId: null,
      },
    });
    expect(inventoryUpdate).toHaveBeenCalledTimes(2);
    expect(inventoryTransactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          branchId: 'branch-1',
          type: InventoryTransactionType.PRODUCTION,
          referenceType: 'production_input',
        }),
      }),
    );
    expect(inventoryTransactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          branchId: 'branch-1',
          type: InventoryTransactionType.PRODUCTION,
          referenceType: 'production_output',
          referenceId: 'batch-1',
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalled();
    expect(result).toEqual({ id: 'batch-1' });
  });
});
