import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/modules/auth/auth.service';
import { ProductsService } from '../../src/modules/products/products.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { SalesService } from '../../src/modules/sales/sales.service';
import { PaymentsService } from '../../src/modules/payments/payments.service';
import { CustomersService } from '../../src/modules/customers/customers.service';
import { RoleName } from '@prisma/client';

describe('Complete Business Workflow Integration', () => {
  let app: TestingModule;
  let prisma: PrismaClient;
  let authService: AuthService;
  let productsService: ProductsService;
  let inventoryService: InventoryService;
  let salesService: SalesService;
  let paymentsService: PaymentsService;
  let customersService: CustomersService;

  let authContext: any;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = app.get<PrismaClient>(PrismaClient);
    authService = app.get<AuthService>(AuthService);
    productsService = app.get<ProductsService>(ProductsService);
    inventoryService = app.get<InventoryService>(InventoryService);
    salesService = app.get<SalesService>(SalesService);
    paymentsService = app.get<PaymentsService>(PaymentsService);
    customersService = app.get<CustomersService>(CustomersService);
  });

  beforeEach(async () => {
    // Clean up database
    await prisma.payment.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();

    // Create test tenant and user
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        email: 'test@tenant.com',
        phone: '+1-800-TEST',
        website: 'https://test.com',
      },
    });
    tenantId = tenant.id;

    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: RoleName.ADMIN },
    });

    const user = await prisma.user.create({
      data: {
        tenantId: tenantId,
        roleId: adminRole.id,
        name: 'Test Admin',
        email: 'admin@test.com',
        passwordHash: 'hashed-password',
      },
    });
    userId = user.id;

    authContext = {
      userId,
      tenantId,
      role: RoleName.ADMIN,
    };
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Complete POS Workflow', () => {
    it('should handle complete sales workflow from product creation to payment', async () => {
      // Step 1: Create a product
      const product = await productsService.create(authContext, {
        name: 'Test Product',
        sku: 'TEST-001',
        type: 'SIMPLE',
        price: 99.99,
        cost: 75.00,
        taxRate: 8.25,
      });

      // Step 2: Add inventory for the product
      await inventoryService.adjust(authContext, {
        productId: product.id,
        quantity: 10,
        type: 'ADJUSTMENT',
        note: 'Initial stock',
      });

      // Step 3: Create a customer
      const customer = await customersService.create(authContext, {
        name: 'Test Customer',
        phone: '+1-800-CUST-001',
        email: 'customer@test.com',
      });

      // Step 4: Create a sale
      const sale = await salesService.create(authContext, {
        customerId: customer.id,
        items: [
          {
            productId: product.id,
            quantity: 2,
            price: 99.99,
          },
        ],
      });

      expect(sale.status).toBe('OPEN');
      expect(sale.items).toHaveLength(1);
      expect(sale.items[0].quantity).toBe(2);
      expect(sale.items[0].price).toBe(99.99);

      // Step 5: Complete the sale with payment
      const completedSale = await salesService.complete(authContext, sale.id, {
        payments: [
          {
            method: 'CASH',
            amount: 199.98,
          },
        ],
      });

      expect(completedSale.status).toBe('COMPLETED');
      expect(completedSale.paidAmount).toBe(199.98);
      expect(completedSale.payments).toHaveLength(1);
      expect(completedSale.payments[0].method).toBe('CASH');
      expect(completedSale.payments[0].amount).toBe(199.98);

      // Step 6: Verify inventory was deducted
      const inventory = await inventoryService.findMany(authContext);
      const productInventory = inventory.find(inv => inv.productId === product.id);
      expect(productInventory?.quantity).toBe(8); // 10 - 2 sold

      // Step 7: Verify payment record exists
      const payments = await paymentsService.findMany(authContext);
      const salePayment = payments.find(p => p.saleId === sale.id);
      expect(salePayment?.amount).toBe(199.98);
      expect(salePayment?.method).toBe('CASH');
      expect(salePayment?.status).toBe('COMPLETED');
    });

    it('should handle partial refund workflow', async () => {
      // Create product and inventory
      const product = await productsService.create(authContext, {
        name: 'Refund Test Product',
        sku: 'REFUND-001',
        type: 'SIMPLE',
        price: 50.00,
        cost: 30.00,
        taxRate: 8.25,
      });

      await inventoryService.adjust(authContext, {
        productId: product.id,
        quantity: 5,
        type: 'ADJUSTMENT',
        note: 'Initial stock',
      });

      // Create and complete sale
      const sale = await salesService.create(authContext, {
        items: [
          {
            productId: product.id,
            quantity: 3,
            price: 50.00,
          },
        ],
      });

      const completedSale = await salesService.complete(authContext, sale.id, {
        payments: [
          {
            method: 'CASH',
            amount: 150.00,
          },
        ],
      });

      expect(completedSale.status).toBe('COMPLETED');

      // Process partial refund
      const refundedSale = await salesService.refund(authContext, sale.id, {
        reason: 'Customer returned 1 item',
        items: [
          {
            saleItemId: completedSale.items[0].id,
            quantity: 1,
          },
        ],
      });

      expect(refundedSale.status).toBe('REFUNDED');

      // Verify inventory was restored
      const inventory = await inventoryService.findMany(authContext);
      const productInventory = inventory.find(inv => inv.productId === product.id);
      expect(productInventory?.quantity).toBe(3); // 5 - 3 sold + 1 refunded

      // Verify refund payment exists
      const payments = await paymentsService.findMany(authContext);
      const refundPayments = payments.filter(p => p.saleId === sale.id && p.direction === 'REFUND');
      expect(refundPayments).toHaveLength(1);
      expect(refundPayments[0].amount).toBe(50.00);
      expect(refundPayments[0].direction).toBe('REFUND');
    });
  });

  describe('Customer Management Workflow', () => {
    it('should handle complete customer lifecycle', async () => {
      // Step 1: Create customer
      const customer = await customersService.create(authContext, {
        name: 'John Doe',
        phone: '+1-800-555-1234',
        email: 'john.doe@example.com',
      });

      expect(customer.id).toBeDefined();
      expect(customer.name).toBe('John Doe');
      expect(customer.email).toBe('john.doe@example.com');

      // Step 2: Find customer by ID
      const foundCustomer = await customersService.findOne(authContext, customer.id);
      expect(foundCustomer?.id).toBe(customer.id);
      expect(foundCustomer?.name).toBe('John Doe');

      // Step 3: Update customer
      const updatedCustomer = await customersService.update(authContext, customer.id, {
        name: 'John Smith',
        phone: '+1-800-555-5678',
        email: 'john.smith@example.com',
      });

      expect(updatedCustomer?.name).toBe('John Smith');
      expect(updatedCustomer?.email).toBe('john.smith@example.com');

      // Step 4: List all customers
      const allCustomers = await customersService.findAll(authContext);
      expect(allCustomers).toHaveLength(1);
      expect(allCustomers[0].name).toBe('John Smith');
    });
  });

  describe('Inventory Management Workflow', () => {
    it('should handle inventory adjustments and low stock alerts', async () => {
      // Create product
      const product = await productsService.create(authContext, {
        name: 'Inventory Test Product',
        sku: 'INV-001',
        type: 'SIMPLE',
        price: 25.00,
        cost: 15.00,
        taxRate: 8.25,
      });

      // Add initial inventory
      await inventoryService.adjust(authContext, {
        productId: product.id,
        quantity: 5,
        type: 'ADJUSTMENT',
        note: 'Initial stock',
      });

      // Check inventory levels
      const inventory = await inventoryService.findMany(authContext);
      const productInventory = inventory.find(inv => inv.productId === product.id);
      expect(productInventory?.quantity).toBe(5);

      // Check low stock alerts
      const lowStockAlerts = await inventoryService.findLowStock(authContext);
      expect(lowStockAlerts).toHaveLength(1);
      expect(lowStockAlerts[0].productId).toBe(product.id);

      // Reduce inventory below threshold
      await inventoryService.adjust(authContext, {
        productId: product.id,
        quantity: 2,
        type: 'ADJUSTMENT',
        note: 'Stock reduction',
      });

      // Verify low stock alert persists
      const updatedLowStockAlerts = await inventoryService.findLowStock(authContext);
      expect(updatedLowStockAlerts).toHaveLength(1);
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should ensure tenant data isolation', async () => {
      // Create second tenant and user
      const tenant2 = await prisma.tenant.create({
        data: {
          name: 'Second Tenant',
          email: 'second@tenant.com',
          phone: '+1-800-SECOND',
          website: 'https://second.com',
        },
      });

      const adminRole = await prisma.role.findUniqueOrThrow({
        where: { name: RoleName.ADMIN },
      });

      const user2 = await prisma.user.create({
        data: {
          tenantId: tenant2.id,
          roleId: adminRole.id,
          name: 'Second Admin',
          email: 'admin2@second.com',
          passwordHash: 'hashed-password',
        },
      });

      const authContext2 = {
        userId: user2.id,
        tenantId: tenant2.id,
        role: RoleName.ADMIN,
      };

      // Create product in tenant 1
      const product1 = await productsService.create(authContext, {
        name: 'Tenant 1 Product',
        sku: 'T1-001',
        type: 'SIMPLE',
        price: 100.00,
        cost: 75.00,
        taxRate: 8.25,
      });

      // Create product in tenant 2
      const product2 = await productsService.create(authContext2, {
        name: 'Tenant 2 Product',
        sku: 'T2-001',
        type: 'SIMPLE',
        price: 200.00,
        cost: 150.00,
        taxRate: 8.25,
      });

      // Verify tenant isolation - tenant 1 should only see its products
      const tenant1Products = await productsService.findAll(authContext);
      expect(tenant1Products).toHaveLength(1);
      expect(tenant1Products[0].sku).toBe('T1-001');

      // Verify tenant isolation - tenant 2 should only see its products
      const tenant2Products = await productsService.findAll(authContext2);
      expect(tenant2Products).toHaveLength(1);
      expect(tenant2Products[0].sku).toBe('T2-001');

      // Verify cross-tenant access is prevented
      await expect(
        productsService.findOne(authContext, product2.id)
      ).rejects.toThrow();

      await expect(
        productsService.findOne(authContext2, product1.id)
      ).rejects.toThrow();
    });
  });
});
