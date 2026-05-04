import { RoleName } from '@prisma/client';
import { ImportsService } from '../../src/modules/imports/imports.service';

describe('ImportsService', () => {
  let service: ImportsService;
  let prisma: any;

  const context = {
    tenantId: 'test-tenant-id',
    userId: 'test-user-id',
    role: RoleName.ADMIN,
  };

  beforeEach(() => {
    prisma = {
      product: {
        upsert: jest.fn(),
      },
      customer: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      supplier: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    } as any;

    service = new ImportsService(prisma as never);
  });

  it('imports products using upsert', async () => {
    prisma.product.upsert.mockResolvedValue({ id: 'product-1' } as any);

    const result = await service.importProducts(context, {
      products: [
        {
          name: 'Test Product 1',
          sku: 'TEST-001',
          price: 99.99,
          cost: 75,
          taxRate: 8.25,
        },
        {
          name: 'Test Product 2',
          sku: 'TEST-002',
          price: 149.99,
        },
      ],
    });

    expect(prisma.product.upsert).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      success: true,
      message: 'Import completed: 2 imported, 0 failed',
      importedCount: 2,
      failedCount: 0,
      errors: undefined,
    });
  });

  it('imports customers and skips duplicates', async () => {
    prisma.customer.findFirst
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({ id: 'existing-customer' } as any);
    prisma.customer.create.mockResolvedValue({ id: 'customer-1' } as any);

    const result = await service.importCustomers(context, {
      customers: [
        { name: 'Customer One', email: 'customer1@test.com', phone: '+1-800-TEST-1' },
        { name: 'Customer Two', email: 'customer1@test.com' },
      ],
    });

    expect(prisma.customer.create).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.importedCount).toBe(1);
    expect(result.failedCount).toBe(1);
  });

  it('imports suppliers and skips duplicates', async () => {
    prisma.supplier.findFirst
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({ id: 'existing-supplier' } as any);
    prisma.supplier.create.mockResolvedValue({ id: 'supplier-1' } as any);

    const result = await service.importSuppliers(context, {
      suppliers: [
        { name: 'Supplier One', email: 'supplier1@test.com', phone: '+1-800-SUPPLIER-1' },
        { name: 'Supplier Two', email: 'supplier1@test.com' },
      ],
    });

    expect(prisma.supplier.create).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.importedCount).toBe(1);
    expect(result.failedCount).toBe(1);
  });
});
