import { RoleName } from '@prisma/client';
import { ExportsService } from '../../src/modules/exports/exports.service';

describe('ExportsService', () => {
  let service: ExportsService;
  let prisma: any;

  const context = {
    tenantId: 'test-tenant-id',
    userId: 'test-user-id',
    role: RoleName.ADMIN,
  };

  beforeEach(() => {
    prisma = {
      product: { findMany: jest.fn() },
      customer: { findMany: jest.fn() },
      supplier: { findMany: jest.fn() },
      inventory: { findMany: jest.fn() },
    } as any;

    service = new ExportsService(prisma as never);
  });

  it('exports products for a tenant', async () => {
    prisma.product.findMany.mockResolvedValue([{ id: 'product-1', name: 'Test Product' }] as any);

    const result = await service.exportProducts(context);

    expect(prisma.product.findMany).toHaveBeenCalledWith({
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
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        count: 1,
        data: [{ id: 'product-1', name: 'Test Product' }],
        exportedAt: expect.any(String),
      }),
    );
  });

  it('exports customers for a tenant', async () => {
    prisma.customer.findMany.mockResolvedValue([{ id: 'customer-1', name: 'Test Customer' }] as any);

    const result = await service.exportCustomers(context);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        count: 1,
        data: [{ id: 'customer-1', name: 'Test Customer' }],
        exportedAt: expect.any(String),
      }),
    );
  });

  it('exports suppliers for a tenant', async () => {
    prisma.supplier.findMany.mockResolvedValue([{ id: 'supplier-1', name: 'Test Supplier' }] as any);

    const result = await service.exportSuppliers(context);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        count: 1,
        data: [{ id: 'supplier-1', name: 'Test Supplier' }],
        exportedAt: expect.any(String),
      }),
    );
  });

  it('exports inventory with an optional branch filter', async () => {
    prisma.inventory.findMany.mockResolvedValue([{ id: 'inventory-1', branchId: 'branch-1' }] as any);

    const result = await service.exportInventory(context, 'branch-1');

    expect(prisma.inventory.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: context.tenantId,
        branchId: 'branch-1',
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
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        count: 1,
        data: [{ id: 'inventory-1', branchId: 'branch-1' }],
        exportedAt: expect.any(String),
      }),
    );
  });
});
