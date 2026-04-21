import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { ImportsService } from '../../src/modules/imports/imports.service';
import { ImportProductsDto } from '../../src/modules/imports/dto/import-products.dto';
import { ImportCustomersDto } from '../../src/modules/imports/dto/import-customers.dto';
import { ImportSuppliersDto } from '../../src/modules/imports/dto/import-suppliers.dto';
import { RoleName } from '@prisma/client';

describe('ImportsService', () => {
  let service: ImportsService;
  let prisma: PrismaService;

  const mockTenantId = 'test-tenant-id';
  const mockUserId = 'test-user-id';

  const mockProducts = [
    {
      name: 'Test Product 1',
      sku: 'TEST-001',
      type: 'SIMPLE',
      price: 99.99,
      cost: 75.00,
      taxRate: 8.25,
    },
    {
      name: 'Test Product 2',
      sku: 'TEST-002',
      type: 'VARIANT',
      price: 149.99,
      cost: 120.00,
      taxRate: 8.25,
    },
  ];

  const mockCustomers = [
    {
      name: 'Test Customer 1',
      phone: '+1-800-TEST-1',
      email: 'customer1@test.com',
    },
    {
      name: 'Test Customer 2',
      phone: '+1-800-TEST-2',
      email: 'customer2@test.com',
    },
  ];

  const mockSuppliers = [
    {
      name: 'Test Supplier 1',
      email: 'supplier1@test.com',
      phone: '+1-800-SUPPLIER-1',
    },
    {
      name: 'Test Supplier 2',
      email: 'supplier2@test.com',
      phone: '+1-800-SUPPLIER-2',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            customer: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            supplier: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation((callback: any) => {
              const tx = {
                product: {
                  findMany: jest.fn(),
                  findFirst: jest.fn(),
                  create: jest.fn(),
                  update: jest.fn(),
                },
                customer: {
                  findMany: jest.fn(),
                  findFirst: jest.fn(),
                  create: jest.fn(),
                  update: jest.fn(),
                },
                supplier: {
                  findMany: jest.fn(),
                  findFirst: jest.fn(),
                  create: jest.fn(),
                  update: jest.fn(),
                },
              };
              return callback(tx);
            }),
          } as any,
        },
      ],
    }).compile();

    service = module.get<ImportsService>(ImportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('importProducts', () => {
    it('should import products successfully', async () => {
      const importDto: ImportProductsDto = {
        products: mockProducts,
      };

      const expectedResult = {
        success: 2,
        failed: 0,
        errors: [],
        details: {
          created: 2,
          updated: 0,
          skipped: 0,
        },
      };

      prisma.product.findMany.mockResolvedValue([]);
      prisma.$transaction.mockImplementation((callback) => {
        const tx = {
          product: {
            create: jest.fn().mockResolvedValue({ id: 'product-1' }),
          },
        };
        return callback(tx);
      });

      const result = await service.importProducts(
        { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
        importDto
      );

      expect(result).toEqual(expectedResult);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          sku: { in: ['TEST-001', 'TEST-002'] },
        },
      });
    });

    it('should handle duplicates by updating existing products', async () => {
      const importDto: ImportProductsDto = {
        products: mockProducts,
      };

      const existingProduct = {
        id: 'existing-product-id',
        sku: 'TEST-001',
        name: 'Existing Product',
      };

      prisma.product.findMany.mockResolvedValue([existingProduct]);

      const expectedResult = {
        success: 2,
        failed: 0,
        errors: [],
        details: {
          created: 1,
          updated: 1,
          skipped: 0,
        },
      };

      prisma.$transaction.mockImplementation((callback) => {
        const tx = {
          product: {
            create: jest.fn().mockResolvedValue({ id: 'new-product-id' }),
            update: jest.fn().mockResolvedValue({ id: 'existing-product-id' }),
          },
        };
        return callback(tx);
      });

      const result = await service.importProducts(
        { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
        importDto
      );

      expect(result).toEqual(expectedResult);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          sku: { in: ['TEST-001', 'TEST-002'] },
        },
      });
    });
  });

  describe('importCustomers', () => {
    it('should import customers successfully', async () => {
      const importDto: ImportCustomersDto = {
        customers: mockCustomers,
      };

      const expectedResult = {
        success: 2,
        failed: 0,
        errors: [],
        details: {
          created: 2,
          updated: 0,
          skipped: 0,
        },
      };

      prisma.customer.findMany.mockResolvedValue([]);
      prisma.$transaction.mockImplementation((callback) => {
        const tx = {
          customer: {
            create: jest.fn().mockResolvedValue({ id: 'customer-1' }),
          },
        };
        return callback(tx);
      });

      const result = await service.importCustomers(
        { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
        importDto
      );

      expect(result).toEqual(expectedResult);
      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          OR: [
            { email: { in: ['customer1@test.com', 'customer2@test.com'] } },
            { phone: { in: ['+1-800-TEST-1', '+1-800-TEST-2'] } },
          ],
        },
      });
    });

    it('should handle duplicates by updating existing customers', async () => {
      const importDto: ImportCustomersDto = {
        customers: mockCustomers,
      };

      const existingCustomer = {
        id: 'existing-customer-id',
        email: 'customer1@test.com',
        name: 'Existing Customer',
      };

      prisma.customer.findMany.mockResolvedValue([existingCustomer]);

      const expectedResult = {
        success: 2,
        failed: 0,
        errors: [],
        details: {
          created: 1,
          updated: 1,
          skipped: 0,
        },
      };

      prisma.$transaction.mockImplementation((callback) => {
        const tx = {
          customer: {
            create: jest.fn().mockResolvedValue({ id: 'new-customer-id' }),
            update: jest.fn().mockResolvedValue({ id: 'existing-customer-id' }),
          },
        };
        return callback(tx);
      });

      const result = await service.importCustomers(
        { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
        importDto
      );

      expect(result).toEqual(expectedResult);
    });
  });

  describe('importSuppliers', () => {
    it('should import suppliers successfully', async () => {
      const importDto: ImportSuppliersDto = {
        suppliers: mockSuppliers,
      };

      const expectedResult = {
        success: 2,
        failed: 0,
        errors: [],
        details: {
          created: 2,
          updated: 0,
          skipped: 0,
        },
      };

      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.$transaction.mockImplementation((callback) => {
        const tx = {
          supplier: {
            create: jest.fn().mockResolvedValue({ id: 'supplier-1' }),
          },
        };
        return callback(tx);
      });

      const result = await service.importSuppliers(
        { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
        importDto
      );

      expect(result).toEqual(expectedResult);
      expect(prisma.supplier.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          OR: [
            { email: { in: ['supplier1@test.com', 'supplier2@test.com'] } },
            { phone: { in: ['+1-800-SUPPLIER-1', '+1-800-SUPPLIER-2'] } },
          ],
        },
      });
    });

    it('should handle duplicates by updating existing suppliers', async () => {
      const importDto: ImportSuppliersDto = {
        suppliers: mockSuppliers,
      };

      const existingSupplier = {
        id: 'existing-supplier-id',
        email: 'supplier1@test.com',
        name: 'Existing Supplier',
      };

      prisma.supplier.findMany.mockResolvedValue([existingSupplier]);

      const expectedResult = {
        success: 2,
        failed: 0,
        errors: [],
        details: {
          created: 1,
          updated: 1,
          skipped: 0,
        },
      };

      prisma.$transaction.mockImplementation((callback) => {
        const tx = {
          supplier: {
            create: jest.fn().mockResolvedValue({ id: 'new-supplier-id' }),
            update: jest.fn().mockResolvedValue({ id: 'existing-supplier-id' }),
          },
        };
        return callback(tx);
      });

      const result = await service.importSuppliers(
        { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
        importDto
      );

      expect(result).toEqual(expectedResult);
    });
  });
});
