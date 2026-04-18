import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { RoleName, ProductType } from '@prisma/client';

/**
 * Comprehensive E2E Test Suite for PTLPOS
 * Tests complete workflows including:
 * - User management and authentication
 * - Product management
 * - Inventory management
 * - Sales process
 * - Payments
 * - Reporting
 */
describe('PTLPOS Complete Workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  // Test users
  const testUsers = {
    admin: {
      email: 'test@aol.com',
      password: 'AdminTest123!',
      name: 'Olalekan Micheal',
      role: 'ADMIN'
    },
    manager: {
      email: 'manager@test.com',
      password: 'ManagerTest123!',
      name: 'Manager User',
      role: 'MANAGER'
    },
    salesRep: {
      email: 'sales@test.com',
      password: 'SalesTest123!',
      name: 'Sales Representative',
      role: 'SALES_REP'
    }
  };

  // JWT tokens
  let tokens = {
    admin: '',
    manager: '',
    salesRep: ''
  };

  // Test data IDs
  let testData = {
    tenantId: '',
    productIds: [] as string[],
    customerId: '',
    supplierId: '',
    saleId: '',
    branchId: ''
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();
    prisma = app.get(PrismaService);

    // Clean up test data
    await cleanupDatabase();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await app.close();
  });

  async function cleanupDatabase() {
    try {
      // Delete in order of dependencies
      await prisma.saleItem.deleteMany();
      await prisma.sale.deleteMany();
      await prisma.payment.deleteMany();
      await prisma.purchaseOrderItem.deleteMany();
      await prisma.purchaseOrder.deleteMany();
      await prisma.inventoryTransaction.deleteMany();
      await prisma.inventory.deleteMany();
      await prisma.recipe.deleteMany();
      await prisma.productVariant.deleteMany();
      await prisma.supplier.deleteMany();
      await prisma.customer.deleteMany();
      await prisma.product.deleteMany();
      await prisma.branch.deleteMany();
      await prisma.auditLog.deleteMany();
      await prisma.user.deleteMany();
      await prisma.role.deleteMany();
      await prisma.tenant.deleteMany();
    } catch (error) {
      // Ignore errors during cleanup
    }
  }

  async function setupTestData() {
    // Create roles
    const roles = await prisma.role.createMany({
      data: [
        { name: RoleName.ADMIN },
        { name: RoleName.MANAGER },
        { name: RoleName.SALES_REP },
      ],
    });

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Retail Company',
        email: 'test@company.com',
      },
    });
    testData.tenantId = tenant.id;

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Branch',
        location: 'Downtown',
        phone: '+1234567890',
        email: 'main@branch.com',
      },
    });
    testData.branchId = branch.id;

    // Create users
    const adminRole = await prisma.role.findUnique({
      where: { name: RoleName.ADMIN },
    });
    const managerRole = await prisma.role.findUnique({
      where: { name: RoleName.MANAGER },
    });
    const salesRole = await prisma.role.findUnique({
      where: { name: RoleName.SALES_REP },
    });

    const passwordHash = await bcrypt.hash('TestPass123!', 10);

    await prisma.user.createMany({
      data: [
        {
          tenantId: tenant.id,
          roleId: adminRole!.id,
          name: testUsers.admin.name,
          email: testUsers.admin.email,
          passwordHash,
        },
        {
          tenantId: tenant.id,
          roleId: managerRole!.id,
          name: testUsers.manager.name,
          email: testUsers.manager.email,
          passwordHash,
        },
        {
          tenantId: tenant.id,
          roleId: salesRole!.id,
          name: testUsers.salesRep.name,
          email: testUsers.salesRep.email,
          passwordHash,
        },
      ],
    });

    // Create test customers
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '5551234567',
        creditLimit: 1000,
      },
    });
    testData.customerId = customer.id;

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name: 'Fresh Foods Supplier',
        email: 'supplier@fresh.com',
        phone: '5559876543',
        address: '123 Supplier Street',
      },
    });
    testData.supplierId = supplier.id;

    // Create products
    const products = await prisma.product.createMany({
      data: [
        {
          tenantId: tenant.id,
          name: 'Burger Deluxe',
          sku: 'BUR001',
          type: ProductType.SIMPLE,
          description: 'Premium beef burger',
          price: 12.99,
          cost: 5.00,
          taxable: true,
        },
        {
          tenantId: tenant.id,
          name: 'Soft Drink',
          sku: 'DRK001',
          type: ProductType.VARIANT,
          description: 'Assorted soft drinks',
          price: 2.99,
          cost: 0.50,
          taxable: true,
        },
        {
          tenantId: tenant.id,
          name: 'T-Shirt Premium',
          sku: 'TSH001',
          type: ProductType.VARIANT,
          description: 'Cotton t-shirt',
          price: 19.99,
          cost: 8.00,
          taxable: true,
        },
        {
          tenantId: tenant.id,
          name: 'Pizza Margherita',
          sku: 'PIZ001',
          type: ProductType.COMPOSITE,
          description: 'Classic pizza',
          price: 15.99,
          cost: 6.00,
          taxable: true,
        },
        {
          tenantId: tenant.id,
          name: 'Fries',
          sku: 'FRY001',
          type: ProductType.SIMPLE,
          description: 'Crispy fries',
          price: 4.99,
          cost: 1.50,
          taxable: true,
        },
      ],
    });

    // Get created products for reference
    const createdProducts = await prisma.product.findMany({
      where: { tenantId: tenant.id },
    });
    testData.productIds = createdProducts.map(p => p.id);

    // Create inventory for products
    for (const product of createdProducts) {
      await prisma.inventory.create({
        data: {
          tenantId: tenant.id,
          branchId: testData.branchId,
          productId: product.id,
          quantity: 100,
          reorderLevel: 20,
        },
      });
    }
  }

  describe('Authentication', () => {
    it('should authenticate admin user and return JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.admin.email,
          password: 'TestPass123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      tokens.admin = response.body.access_token;
    });

    it('should authenticate manager user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.manager.email,
          password: 'TestPass123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      tokens.manager = response.body.access_token;
    });

    it('should authenticate sales rep user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.salesRep.email,
          password: 'TestPass123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      tokens.salesRep = response.body.access_token;
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.admin.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });
  });

  describe('Product Management', () => {
    it('should list all products for tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta).toHaveProperty('total');
    });

    it('should filter products by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?type=SIMPLE')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(response.body.data.every((p: any) => p.type === 'SIMPLE')).toBe(true);
    });

    it('should search products by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?q=Burger')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toContain('Burger');
    });

    it('should update product pricing', async () => {
      const productId = testData.productIds[0];
      const response = await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          price: 14.99,
          cost: 5.50,
        })
        .expect(200);

      expect(response.body.price).toBe(14.99);
      expect(response.body.cost).toBe(5.50);
    });

    it('should not allow sales rep to update products', async () => {
      const productId = testData.productIds[0];
      await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .send({
          price: 15.99,
        })
        .expect(403);
    });
  });

  describe('Inventory Management', () => {
    it('should get inventory levels', async () => {
      const response = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should adjust inventory stock', async () => {
      const productId = testData.productIds[0];
      
      const response = await request(app.getHttpServer())
        .post('/inventory/adjust')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send({
          branchId: testData.branchId,
          productId,
          quantityChange: -5,
          reason: 'Damage during delivery',
        })
        .expect(200);

      expect(response.body).toHaveProperty('quantity');
    });

    it('should track inventory transactions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/inventory/transactions`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Sales Process', () => {
    it('should create a new sale with single item', async () => {
      const productId = testData.productIds[0];
      
      const response = await request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .send({
          branchId: testData.branchId,
          customerId: testData.customerId,
          items: [
            {
              productId,
              quantity: 2,
              unitPrice: 12.99,
            }
          ],
          subtotal: 25.98,
          tax: 2.08,
          total: 28.06,
          paymentMethod: 'CASH',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.items.length).toBe(1);
      testData.saleId = response.body.id;
    });

    it('should create a sale with multiple items', async () => {
      const response = await request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .send({
          branchId: testData.branchId,
          customerId: testData.customerId,
          items: [
            {
              productId: testData.productIds[0],
              quantity: 1,
              unitPrice: 12.99,
            },
            {
              productId: testData.productIds[1],
              quantity: 2,
              unitPrice: 2.99,
            }
          ],
          subtotal: 18.97,
          tax: 1.52,
          total: 20.49,
          paymentMethod: 'CARD',
        })
        .expect(201);

      expect(response.body.items.length).toBe(2);
    });

    it('should create a held sale', async () => {
      const response = await request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .send({
          branchId: testData.branchId,
          items: [
            {
              productId: testData.productIds[0],
              quantity: 1,
              unitPrice: 12.99,
            }
          ],
          subtotal: 12.99,
          tax: 1.04,
          total: 14.03,
          status: 'HELD',
        })
        .expect(201);

      expect(response.body.status).toBe('HELD');
    });

    it('should retrieve sale details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sales/${testData.saleId}`)
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .expect(200);

      expect(response.body.id).toBe(testData.saleId);
      expect(response.body.items).toBeInstanceOf(Array);
    });

    it('should list sales for the user', async () => {
      const response = await request(app.getHttpServer())
        .get('/sales')
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('total');
    });

    it('should apply discount to sale', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sales/${testData.saleId}/discount`)
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .send({
          type: 'PERCENTAGE',
          value: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('discount');
    });

    it('should complete payment for sale', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sales/${testData.saleId}/payment`)
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .send({
          method: 'CASH',
          amount: 28.06,
        })
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');
    });

    it('should refund a sale (partial)', async () => {
      // Create a sale first
      const saleResponse = await request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .send({
          branchId: testData.branchId,
          items: [
            {
              productId: testData.productIds[1],
              quantity: 3,
              unitPrice: 2.99,
            }
          ],
          subtotal: 8.97,
          tax: 0.72,
          total: 9.69,
          paymentMethod: 'CASH',
        });

      const saleId = saleResponse.body.id;

      // Refund the sale
      const refundResponse = await request(app.getHttpServer())
        .post(`/sales/${saleId}/refund`)
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send({
          items: [
            {
              productId: testData.productIds[1],
              quantity: 2,
            }
          ],
          reason: 'Customer request',
        })
        .expect(200);

      expect(refundResponse.body).toHaveProperty('refundAmount');
    });
  });

  describe('Customer Management', () => {
    it('should create a new customer', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send({
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '5559876543',
          creditLimit: 500,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Jane Smith');
    });

    it('should update customer information', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/customers/${testData.customerId}`)
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send({
          phone: '5552223333',
          creditLimit: 1500,
        })
        .expect(200);

      expect(response.body.phone).toBe('5552223333');
      expect(response.body.creditLimit).toBe(1500);
    });

    it('should list all customers', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('total');
    });
  });

  describe('Purchase Orders', () => {
    it('should create a purchase order', async () => {
      const response = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send({
          supplierId: testData.supplierId,
          items: [
            {
              productId: testData.productIds[0],
              quantity: 50,
              unitPrice: 5.00,
            }
          ],
          subtotal: 250,
          tax: 20,
          total: 270,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
    });

    it('should approve a purchase order', async () => {
      const poResponse = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send({
          supplierId: testData.supplierId,
          items: [
            {
              productId: testData.productIds[1],
              quantity: 100,
              unitPrice: 0.50,
            }
          ],
          subtotal: 50,
          tax: 4,
          total: 54,
        });

      const poId = poResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/purchase-orders/${poId}/approve`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(response.body.status).toBe('APPROVED');
    });
  });

  describe('Reporting & Analytics', () => {
    it('should get daily sales report', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await request(app.getHttpServer())
        .get(`/analytics/sales?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${tokens.manager}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalSales');
      expect(response.body).toHaveProperty('totalTransactions');
      expect(response.body).toHaveProperty('avgTransactionValue');
    });

    it('should get product performance report', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/products')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should get inventory report', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/inventory')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .expect(200);

      expect(response.body).toHaveProperty('lowStockItems');
      expect(response.body).toHaveProperty('totalValue');
    });

    it('should get customer analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/customers')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalCustomers');
      expect(response.body).toHaveProperty('averageOrderValue');
    });
  });

  describe('Audit Logging', () => {
    it('should track all user actions in audit log', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter audit logs by action', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs?action=CREATE_SALE')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(response.body.data.every((log: any) => log.action === 'CREATE_SALE')).toBe(true);
    });
  });

  describe('Authorization & Security', () => {
    it('should prevent unauthorized access without token', async () => {
      await request(app.getHttpServer())
        .get('/sales')
        .expect(401);
    });

    it('should prevent access with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/sales')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should prevent sales rep from accessing user management', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .expect(403);
    });

    it('should prevent manager from approving purchase orders', async () => {
      const poResponse = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send({
          supplierId: testData.supplierId,
          items: [
            {
              productId: testData.productIds[0],
              quantity: 25,
              unitPrice: 5.00,
            }
          ],
          subtotal: 125,
          tax: 10,
          total: 135,
        });

      const poId = poResponse.body.id;

      await request(app.getHttpServer())
        .patch(`/purchase-orders/${poId}/approve`)
        .set('Authorization', `Bearer ${tokens.manager}`)
        .expect(403);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain inventory accuracy after sale', async () => {
      const productId = testData.productIds[0];
      
      // Get initial inventory
      const beforeSale = await prisma.inventory.findFirst({
        where: {
          productId,
          branchId: testData.branchId,
        },
      });

      const initialQuantity = beforeSale?.quantity || 0;

      // Create sale
      await request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .send({
          branchId: testData.branchId,
          items: [
            {
              productId,
              quantity: 3,
              unitPrice: 12.99,
            }
          ],
          subtotal: 38.97,
          tax: 3.12,
          total: 42.09,
          paymentMethod: 'CASH',
        });

      // Check inventory was decremented
      const afterSale = await prisma.inventory.findFirst({
        where: {
          productId,
          branchId: testData.branchId,
        },
      });

      expect(afterSale?.quantity).toBe(initialQuantity - 3);
    });

    it('should restore inventory on refund', async () => {
      const productId = testData.productIds[1];
      
      // Get initial inventory
      const beforeRefund = await prisma.inventory.findFirst({
        where: {
          productId,
          branchId: testData.branchId,
        },
      });

      const initialQuantity = beforeRefund?.quantity || 0;

      // Create and refund a sale
      const saleResponse = await request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .send({
          branchId: testData.branchId,
          items: [
            {
              productId,
              quantity: 2,
              unitPrice: 2.99,
            }
          ],
          subtotal: 5.98,
          tax: 0.48,
          total: 6.46,
          paymentMethod: 'CASH',
        });

      const saleId = saleResponse.body.id;

      // Refund
      await request(app.getHttpServer())
        .post(`/sales/${saleId}/refund`)
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send({
          items: [
            {
              productId,
              quantity: 2,
            }
          ],
          reason: 'Test refund',
        });

      // Check inventory was restored
      const afterRefund = await prisma.inventory.findFirst({
        where: {
          productId,
          branchId: testData.branchId,
        },
      });

      expect(afterRefund?.quantity).toBe(initialQuantity);
    });
  });

  describe('Error Handling', () => {
    it('should handle insufficient inventory', async () => {
      const productId = testData.productIds[0];
      
      // Try to sell more than available
      const response = await request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .send({
          branchId: testData.branchId,
          items: [
            {
              productId,
              quantity: 10000,
              unitPrice: 12.99,
            }
          ],
          subtotal: 129900,
          tax: 10392,
          total: 140292,
          paymentMethod: 'CASH',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle duplicate email on user creation', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          name: 'Duplicate User',
          email: testUsers.admin.email,
          roleId: 'some-role-id',
          password: 'NewPass123!',
        });

      expect(response.status).toBe(400);
    });

    it('should handle invalid discount', async () => {
      const saleResponse = await request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .send({
          branchId: testData.branchId,
          items: [
            {
              productId: testData.productIds[0],
              quantity: 1,
              unitPrice: 12.99,
            }
          ],
          subtotal: 12.99,
          tax: 1.04,
          total: 14.03,
          paymentMethod: 'CASH',
        });

      const saleId = saleResponse.body.id;

      const response = await request(app.getHttpServer())
        .post(`/sales/${saleId}/discount`)
        .set('Authorization', `Bearer ${tokens.salesRep}`)
        .send({
          type: 'PERCENTAGE',
          value: 150, // Invalid: > 100%
        });

      expect(response.status).toBe(400);
    });
  });
});
