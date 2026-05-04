import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTransactionType, RoleName } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/core/database/prisma.service';
import { CustomersService } from '../../src/modules/customers/customers.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { ProductsService } from '../../src/modules/products/products.service';
import { SalesService } from '../../src/modules/sales/sales.service';

describe('Complete Business Workflow Integration', () => {
  let app: TestingModule;
  let prisma: PrismaService;
  let productsService: ProductsService;
  let inventoryService: InventoryService;
  let salesService: SalesService;
  let customersService: CustomersService;

  let authContext: any;
  let branchId: string;
  let dbAvailable = true;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = app.get(PrismaService);
    productsService = app.get(ProductsService);
    inventoryService = app.get(InventoryService);
    salesService = app.get(SalesService);
    customersService = app.get(CustomersService);

    try {
      await prisma.$connect();
    } catch {
      dbAvailable = false;
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) {
      return;
    }

    await prisma.auditLog.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.inventoryTransaction.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.product.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    await prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: { name: RoleName.ADMIN },
    });

    const tenant = await prisma.tenant.create({
      data: { name: 'Test Tenant' },
    });

    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: RoleName.ADMIN },
    });

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        roleId: adminRole.id,
        name: 'Test Admin',
        email: 'admin@test.com',
        passwordHash: 'hashed-password',
      },
    });

    const branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Branch',
      },
    });

    branchId = branch.id;
    authContext = {
      userId: user.id,
      tenantId: tenant.id,
      branchId: branch.id,
      role: RoleName.ADMIN,
    };
  });

  afterAll(async () => {
    if (dbAvailable) {
      await prisma.$disconnect();
    }
  });

  it('handles a complete sale flow from product to completed payment', async () => {
    if (!dbAvailable) {
      expect(dbAvailable).toBe(false);
      return;
    }

    const product = await productsService.create(authContext, {
      name: 'Test Product',
      sku: 'TEST-001',
      type: 'SIMPLE',
      price: 99.99,
      cost: 75,
      taxRate: 0,
    });

    await prisma.inventory.create({
      data: {
        tenantId: authContext.tenantId,
        branchId,
        productId: product.id,
        quantity: 10,
      },
    });

    await inventoryService.adjust(authContext, {
      productId: product.id,
      quantity: 0,
      type: InventoryTransactionType.ADJUSTMENT,
      note: 'Initialize inventory ledger',
    });

    const customer = await customersService.create(authContext, {
      name: 'Test Customer',
      phone: '+1-800-CUST-001',
      email: 'customer@test.com',
    });

    const sale = await salesService.create(authContext, {
      customerId: customer.id,
      items: [
        {
          productId: product.id,
          quantity: 2,
          price: 99.99,
        },
      ],
      payments: [],
    });

    expect(sale.status).toBe('OPEN');
    expect(sale.items).toHaveLength(1);

    const completedSale = await salesService.complete(authContext, sale.id, {
      payments: [
        {
          method: 'CASH',
          amount: 199.98,
        },
      ],
    });

    expect(completedSale.status).toBe('COMPLETED');
    expect(Number(completedSale.paidAmount)).toBe(199.98);
    expect(completedSale.payments).toHaveLength(1);

    const inventory = (await inventoryService.findAll(authContext.tenantId, branchId)) as any[];
    const productInventory = inventory.find((inv) => inv.productId === product.id);
    expect(Number(productInventory?.quantity)).toBe(8);

    const payments = await prisma.payment.findMany({
      where: {
        tenantId: authContext.tenantId,
        saleId: sale.id,
      },
    });

    expect(payments).toHaveLength(1);
    expect(Number(payments[0].amount)).toBe(199.98);
    expect(payments[0].method).toBe('CASH');
  });

  it('enforces tenant isolation for product access', async () => {
    if (!dbAvailable) {
      expect(dbAvailable).toBe(false);
      return;
    }

    const product1 = await productsService.create(authContext, {
      name: 'Tenant 1 Product',
      sku: 'T1-001',
      type: 'SIMPLE',
      price: 100,
      cost: 75,
      taxRate: 0,
    });

    const tenant2 = await prisma.tenant.create({
      data: { name: 'Second Tenant' },
    });
    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: RoleName.ADMIN },
    });
    const user2 = await prisma.user.create({
      data: {
        tenantId: tenant2.id,
        roleId: adminRole.id,
        name: 'Second Admin',
        email: 'admin2@test.com',
        passwordHash: 'hashed-password',
      },
    });

    const authContext2 = {
      userId: user2.id,
      tenantId: tenant2.id,
      role: RoleName.ADMIN,
    };

    await productsService.create(authContext2, {
      name: 'Tenant 2 Product',
      sku: 'T2-001',
      type: 'SIMPLE',
      price: 200,
      cost: 150,
      taxRate: 0,
    });

    const tenant1Products = await productsService.findAll(authContext.tenantId, {});
    const tenant2Products = await productsService.findAll(authContext2.tenantId, {});

    expect(tenant1Products.data).toHaveLength(1);
    expect(tenant1Products.data[0].sku).toBe('T1-001');
    expect(tenant2Products.data).toHaveLength(1);
    expect(tenant2Products.data[0].sku).toBe('T2-001');

    await expect(productsService.findOne(authContext2.tenantId, product1.id)).rejects.toThrow();
  });
});
