import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@prisma/client';
import { ExportsService } from '../../src/modules/exports/exports.service';
import { RoleName } from '@prisma/client';

describe('ExportsService', () => {
  let service: ExportsService;
  let prisma: PrismaService;

  const mockTenantId = 'test-tenant-id';
  const mockUserId = 'test-user-id';

  const mockProducts = [
    {
      id: 'product-1',
      tenantId: mockTenantId,
      name: 'Test Product 1',
      sku: 'TEST-001',
      type: 'SIMPLE',
      price: '99.99',
      cost: '75.00',
      taxRate: '8.25',
      imageUrl: 'https://example.com/product1.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'product-2',
      tenantId: mockTenantId,
      name: 'Test Product 2',
      sku: 'TEST-002',
      type: 'VARIANT',
      price: '149.99',
      cost: '120.00',
      taxRate: '8.25',
      imageUrl: 'https://example.com/product2.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockCustomers = [
    {
      id: 'customer-1',
      tenantId: mockTenantId,
      name: 'Test Customer 1',
      phone: '+1-800-TEST-1',
      email: 'customer1@test.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'customer-2',
      tenantId: mockTenantId,
      name: 'Test Customer 2',
      phone: '+1-800-TEST-2',
      email: 'customer2@test.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockSuppliers = [
    {
      id: 'supplier-1',
      tenantId: mockTenantId,
      name: 'Test Supplier 1',
      email: 'supplier1@test.com',
      phone: '+1-800-SUPPLIER-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'supplier-2',
      tenantId: mockTenantId,
      name: 'Test Supplier 2',
      email: 'supplier2@test.com',
      phone: '+1-800-SUPPLIER-2',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockInventory = [
    {
      id: 'inventory-1',
      tenantId: mockTenantId,
      branchId: 'branch-1',
      productId: 'product-1',
      productVariantId: null,
      quantity: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'inventory-2',
      tenantId: mockTenantId,
      branchId: 'branch-2',
      productId: 'product-2',
      productVariantId: null,
      quantity: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
            },
            customer: {
              findMany: jest.fn(),
            },
            supplier: {
              findMany: jest.fn(),
            },
            inventory: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ExportsService>(ExportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('exportProducts', () => {
    it('should return all products for tenant', async () => {
      const expectedCsv = 'id,name,sku,type,price,cost,taxRate,imageUrl\n' +
        'product-1,Test Product 1,TEST-001,SIMPLE,99.99,75.00,8.25,https://example.com/product1.jpg\n' +
        'product-2,Test Product 2,TEST-002,VARIANT,149.99,120.00,8.25,https://example.com/product2.jpg\n';

      prisma.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.exportProducts({ tenantId: mockTenantId });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        include: { variants: true },
      });
      expect(result).toEqual(expectedCsv);
    });
  });

  describe('exportCustomers', () => {
    it('should return all customers for tenant', async () => {
      const expectedCsv = 'id,name,phone,email\n' +
        'customer-1,Test Customer 1,+1-800-TEST-1,customer1@test.com\n' +
        'customer-2,Test Customer 2,+1-800-TEST-2,customer2@test.com\n';

      prisma.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await service.exportCustomers({ tenantId: mockTenantId });

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
      });
      expect(result).toEqual(expectedCsv);
    });
  });

  describe('exportSuppliers', () => {
    it('should return all suppliers for tenant', async () => {
      const expectedCsv = 'id,name,email,phone\n' +
        'supplier-1,Test Supplier 1,supplier1@test.com,+1-800-SUPPLIER-1\n' +
        'supplier-2,Test Supplier 2,supplier2@test.com,+1-800-SUPPLIER-2\n';

      prisma.supplier.findMany.mockResolvedValue(mockSuppliers);

      const result = await service.exportSuppliers({ tenantId: mockTenantId });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
      });
      expect(result).toEqual(expectedCsv);
    });
  });

  describe('exportInventory', () => {
    it('should return inventory for tenant with optional branch filter', async () => {
      const expectedCsv = 'id,branchId,productId,productVariantId,quantity\n' +
        'inventory-1,branch-1,product-1,,10\n' +
        'inventory-2,branch-2,product-2,,5\n';

      prisma.inventory.findMany.mockResolvedValue(mockInventory);

      const result = await service.exportInventory({ tenantId: mockTenantId });

      expect(prisma.inventory.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        include: {
          product: { select: { sku: true, name: true } },
          branch: { select: { name: true } },
        },
      });
      expect(result).toEqual(expectedCsv);
    });

    it('should filter inventory by branch when branchId is provided', async () => {
      const branchId = 'branch-1';
      const expectedCsv = 'id,branchId,productId,productVariantId,quantity\n' +
        'inventory-1,branch-1,product-1,,10\n';

      prisma.inventory.findMany.mockResolvedValue([mockInventory[0]]);

      const result = await service.exportInventory({ tenantId: mockTenantId }, branchId);

      expect(prisma.inventory.findMany).toHaveBeenCalledWith({
        where: { 
          tenantId: mockTenantId,
          branchId: branchId,
        },
        include: {
          product: { select: { sku: true, name: true } },
          branch: { select: { name: true } },
        },
      });
      expect(result).toEqual(expectedCsv);
    });
  });
});
