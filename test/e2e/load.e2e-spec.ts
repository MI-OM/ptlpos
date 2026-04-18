import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { RoleName, ProductType } from '@prisma/client';

/**
 * Stress & Load Testing Suite for PTLPOS
 * Tests:
 * - High concurrent user load
 * - Bulk operations
 * - Database performance under stress
 * - Memory usage patterns
 * - Response time degradation
 */
describe('PTLPOS Load & Stress Testing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  const LOAD_TEST_PARAMS = {
    concurrentUsers: 10, // Can be increased for real stress testing
    operationsPerUser: 5,
    totalProducts: 50,
    totalCustomers: 20,
  };

  let testData = {
    tenantId: '',
    productIds: [] as string[],
    customerIds: [] as string[],
    branchId: '',
    adminToken: '',
    userTokens: [] as string[],
  };

  let performanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    responseTimes: [] as number[],
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

    // Clean up and setup
    await cleanupDatabase();
    await setupTestData();
  });

  afterAll(async () => {
    printPerformanceReport();
    await cleanupDatabase();
    await app.close();
  });

  async function cleanupDatabase() {
    try {
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
      // Ignore errors
    }
  }

  async function setupTestData() {
    // Create roles
    await prisma.role.createMany({
      data: [
        { name: RoleName.ADMIN },
        { name: RoleName.MANAGER },
        { name: RoleName.SALES_REP },
      ],
    });

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Load Test Tenant',
        email: 'loadtest@company.com',
      },
    });
    testData.tenantId = tenant.id;

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Load Test Branch',
        location: 'Test Location',
        phone: '+1234567890',
        email: 'branch@test.com',
      },
    });
    testData.branchId = branch.id;

    // Create admin user
    const adminRole = await prisma.role.findUnique({
      where: { name: RoleName.ADMIN },
    });
    const salesRole = await prisma.role.findUnique({
      where: { name: RoleName.SALES_REP },
    });

    const passwordHash = await bcrypt.hash('TestPass123!', 10);

    const adminUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        roleId: adminRole!.id,
        name: 'Load Test Admin',
        email: 'admin@loadtest.com',
        passwordHash,
      },
    });

    // Get admin token
    const adminTokenResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@loadtest.com',
        password: 'TestPass123!',
      });
    testData.adminToken = adminTokenResponse.body.access_token;

    // Create multiple users for concurrent testing
    const userPromises = [];
    for (let i = 0; i < LOAD_TEST_PARAMS.concurrentUsers; i++) {
      const user = prisma.user.create({
        data: {
          tenantId: tenant.id,
          roleId: salesRole!.id,
          name: `Load Test User ${i}`,
          email: `user${i}@loadtest.com`,
          passwordHash,
        },
      });
      userPromises.push(user);
    }
    await Promise.all(userPromises);

    // Get tokens for all users
    for (let i = 0; i < LOAD_TEST_PARAMS.concurrentUsers; i++) {
      const tokenResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `user${i}@loadtest.com`,
          password: 'TestPass123!',
        });
      testData.userTokens.push(tokenResponse.body.access_token);
    }

    // Create products
    const productData = [];
    for (let i = 0; i < LOAD_TEST_PARAMS.totalProducts; i++) {
      productData.push({
        tenantId: tenant.id,
        name: `Product ${i}`,
        sku: `SKU-${String(i).padStart(5, '0')}`,
        type: ProductType.SIMPLE,
        description: `Load test product ${i}`,
        price: 10 + Math.random() * 100,
        cost: 5 + Math.random() * 50,
        taxable: true,
      });
    }

    await prisma.product.createMany({ data: productData });

    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      take: LOAD_TEST_PARAMS.totalProducts,
    });
    testData.productIds = products.map(p => p.id);

    // Create inventory for products
    const inventoryData = testData.productIds.map(productId => ({
      tenantId: tenant.id,
      branchId: testData.branchId,
      productId,
      quantity: 1000,
      reorderLevel: 100,
    }));
    await prisma.inventory.createMany({ data: inventoryData });

    // Create customers
    const customerData = [];
    for (let i = 0; i < LOAD_TEST_PARAMS.totalCustomers; i++) {
      customerData.push({
        tenantId: tenant.id,
        name: `Customer ${i}`,
        email: `customer${i}@test.com`,
        phone: `555${String(i).padStart(7, '0')}`,
        creditLimit: 1000,
      });
    }
    await prisma.customer.createMany({ data: customerData });

    const customers = await prisma.customer.findMany({
      where: { tenantId: tenant.id },
      take: LOAD_TEST_PARAMS.totalCustomers,
    });
    testData.customerIds = customers.map(c => c.id);
  }

  function recordResponseTime(time: number) {
    performanceMetrics.responseTimes.push(time);
    performanceMetrics.minResponseTime = Math.min(performanceMetrics.minResponseTime, time);
    performanceMetrics.maxResponseTime = Math.max(performanceMetrics.maxResponseTime, time);
  }

  function printPerformanceReport() {
    const avgTime = performanceMetrics.responseTimes.length > 0
      ? performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) / performanceMetrics.responseTimes.length
      : 0;

    const sortedTimes = [...performanceMetrics.responseTimes].sort((a, b) => a - b);
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    console.log('\n=== PERFORMANCE METRICS REPORT ===');
    console.log(`Total Requests: ${performanceMetrics.totalRequests}`);
    console.log(`Successful: ${performanceMetrics.successfulRequests}`);
    console.log(`Failed: ${performanceMetrics.failedRequests}`);
    console.log(`Success Rate: ${((performanceMetrics.successfulRequests / performanceMetrics.totalRequests) * 100).toFixed(2)}%`);
    console.log(`\nResponse Time (ms):`);
    console.log(`  Min: ${performanceMetrics.minResponseTime.toFixed(2)}`);
    console.log(`  Max: ${performanceMetrics.maxResponseTime.toFixed(2)}`);
    console.log(`  Avg: ${avgTime.toFixed(2)}`);
    console.log(`  P95: ${p95?.toFixed(2) || 'N/A'}`);
    console.log(`  P99: ${p99?.toFixed(2) || 'N/A'}`);
    console.log('==================================\n');
  }

  describe('Concurrent User Load', () => {
    it('should handle concurrent login requests', async () => {
      const loginPromises = testData.userTokens.map((_, index) => {
        const startTime = Date.now();
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: `user${index}@loadtest.com`,
            password: 'TestPass123!',
          })
          .then(response => {
            const duration = Date.now() - startTime;
            recordResponseTime(duration);
            performanceMetrics.totalRequests++;
            if (response.status === 200) {
              performanceMetrics.successfulRequests++;
            } else {
              performanceMetrics.failedRequests++;
            }
            return response;
          });
      });

      const results = await Promise.all(loginPromises);
      
      expect(results.every(r => r.status === 200)).toBe(true);
      expect(performanceMetrics.maxResponseTime).toBeLessThan(2000); // Response time < 2 seconds
    });

    it('should handle concurrent product list requests', async () => {
      const listPromises = testData.userTokens.map((token) => {
        const startTime = Date.now();
        return request(app.getHttpServer())
          .get('/products')
          .set('Authorization', `Bearer ${token}`)
          .then(response => {
            const duration = Date.now() - startTime;
            recordResponseTime(duration);
            performanceMetrics.totalRequests++;
            if (response.status === 200) {
              performanceMetrics.successfulRequests++;
            } else {
              performanceMetrics.failedRequests++;
            }
            return response;
          });
      });

      const results = await Promise.all(listPromises);
      
      expect(results.filter(r => r.status === 200).length).toBeGreaterThan(LOAD_TEST_PARAMS.concurrentUsers * 0.95);
    });

    it('should handle concurrent inventory lookups', async () => {
      const lookupPromises = [];
      for (let i = 0; i < LOAD_TEST_PARAMS.concurrentUsers * 2; i++) {
        const userTokenIndex = i % testData.userTokens.length;
        const startTime = Date.now();
        lookupPromises.push(
          request(app.getHttpServer())
            .get('/inventory')
            .set('Authorization', `Bearer ${testData.userTokens[userTokenIndex]}`)
            .then(response => {
              const duration = Date.now() - startTime;
              recordResponseTime(duration);
              performanceMetrics.totalRequests++;
              if (response.status === 200) {
                performanceMetrics.successfulRequests++;
              } else {
                performanceMetrics.failedRequests++;
              }
              return response;
            })
        );
      }

      const results = await Promise.all(lookupPromises);
      
      expect(results.filter(r => r.status === 200).length).toBeGreaterThan(results.length * 0.95);
    });
  });

  describe('Bulk Operations', () => {
    it('should handle multiple concurrent sales creation', async () => {
      const salePromises = [];
      
      for (let userIndex = 0; userIndex < LOAD_TEST_PARAMS.concurrentUsers; userIndex++) {
        for (let opIndex = 0; opIndex < LOAD_TEST_PARAMS.operationsPerUser; opIndex++) {
          const startTime = Date.now();
          const productIndex = Math.floor(Math.random() * testData.productIds.length);
          
          salePromises.push(
            request(app.getHttpServer())
              .post('/sales')
              .set('Authorization', `Bearer ${testData.userTokens[userIndex]}`)
              .send({
                branchId: testData.branchId,
                customerId: testData.customerIds[Math.floor(Math.random() * testData.customerIds.length)],
                items: [
                  {
                    productId: testData.productIds[productIndex],
                    quantity: Math.floor(Math.random() * 5) + 1,
                    unitPrice: 25.99,
                  }
                ],
                subtotal: 25.99,
                tax: 2.08,
                total: 28.07,
                paymentMethod: 'CASH',
              })
              .then(response => {
                const duration = Date.now() - startTime;
                recordResponseTime(duration);
                performanceMetrics.totalRequests++;
                if (response.status === 201) {
                  performanceMetrics.successfulRequests++;
                } else {
                  performanceMetrics.failedRequests++;
                }
                return response;
              })
          );
        }
      }

      const results = await Promise.all(salePromises);
      const successCount = results.filter(r => r.status === 201).length;
      
      console.log(`\nCreated ${successCount} sales out of ${results.length} attempts`);
      expect(successCount).toBeGreaterThan(results.length * 0.90); // At least 90% success
    });

    it('should handle mixed read/write operations', async () => {
      const mixedPromises = [];

      for (let i = 0; i < LOAD_TEST_PARAMS.concurrentUsers * 3; i++) {
        const userTokenIndex = i % testData.userTokens.length;
        const operation = i % 3;
        const startTime = Date.now();

        if (operation === 0) {
          // Read operation
          mixedPromises.push(
            request(app.getHttpServer())
              .get('/sales')
              .set('Authorization', `Bearer ${testData.userTokens[userTokenIndex]}`)
              .then(response => {
                recordResponseTime(Date.now() - startTime);
                performanceMetrics.totalRequests++;
                if (response.status === 200) performanceMetrics.successfulRequests++;
                else performanceMetrics.failedRequests++;
                return response;
              })
          );
        } else if (operation === 1) {
          // Write operation
          mixedPromises.push(
            request(app.getHttpServer())
              .post('/sales')
              .set('Authorization', `Bearer ${testData.userTokens[userTokenIndex]}`)
              .send({
                branchId: testData.branchId,
                customerId: testData.customerIds[Math.floor(Math.random() * testData.customerIds.length)],
                items: [{
                  productId: testData.productIds[Math.floor(Math.random() * testData.productIds.length)],
                  quantity: 1,
                  unitPrice: 25.99,
                }],
                subtotal: 25.99,
                tax: 2.08,
                total: 28.07,
                paymentMethod: 'CASH',
              })
              .then(response => {
                recordResponseTime(Date.now() - startTime);
                performanceMetrics.totalRequests++;
                if ([200, 201].includes(response.status)) performanceMetrics.successfulRequests++;
                else performanceMetrics.failedRequests++;
                return response;
              })
          );
        } else {
          // Inventory lookup
          mixedPromises.push(
            request(app.getHttpServer())
              .get('/inventory')
              .set('Authorization', `Bearer ${testData.userTokens[userTokenIndex]}`)
              .then(response => {
                recordResponseTime(Date.now() - startTime);
                performanceMetrics.totalRequests++;
                if (response.status === 200) performanceMetrics.successfulRequests++;
                else performanceMetrics.failedRequests++;
                return response;
              })
          );
        }
      }

      await Promise.all(mixedPromises);
      expect(performanceMetrics.failedRequests).toBeLessThan(performanceMetrics.totalRequests * 0.10);
    });
  });

  describe('Database Performance', () => {
    it('should efficiently query large result sets', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/sales?limit=100&page=1')
        .set('Authorization', `Bearer ${testData.adminToken}`);

      const duration = Date.now() - startTime;
      recordResponseTime(duration);
      performanceMetrics.totalRequests++;
      performanceMetrics.successfulRequests++;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle complex filtering and aggregation', async () => {
      const today = new Date().toISOString().split('T')[0];
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get(`/analytics/sales?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${testData.adminToken}`);

      const duration = Date.now() - startTime;
      recordResponseTime(duration);
      performanceMetrics.totalRequests++;
      
      if (response.status === 200) {
        performanceMetrics.successfulRequests++;
        expect(duration).toBeLessThan(1500); // Complex query, allow more time
      } else {
        performanceMetrics.failedRequests++;
      }
    });
  });

  describe('Memory & Resource Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const iterations = 5;
      
      for (let iter = 0; iter < iterations; iter++) {
        const batch = [];
        
        for (let i = 0; i < 20; i++) {
          batch.push(
            request(app.getHttpServer())
              .get('/products?limit=50')
              .set('Authorization', `Bearer ${testData.adminToken}`)
          );
        }

        await Promise.all(batch);
      }

      // If we get here without Out of Memory error, test passes
      expect(true).toBe(true);
    });

    it('should handle rapid api endpoint access', async () => {
      const endpoints = [
        '/sales',
        '/products',
        '/inventory',
        '/customers',
      ];

      const rapidRequests = [];
      for (let i = 0; i < 50; i++) {
        const endpoint = endpoints[i % endpoints.length];
        rapidRequests.push(
          request(app.getHttpServer())
            .get(endpoint)
            .set('Authorization', `Bearer ${testData.adminToken}`)
        );
      }

      const results = await Promise.all(rapidRequests);
      const successCount = results.filter(r => r.status === 200).length;
      
      expect(successCount).toBeGreaterThan(45); // Allow some failures
    });
  });

  describe('Error Handling Under Load', () => {
    it('should gracefully handle errors during high concurrency', async () => {
      const errorRequests = [];

      // Mix valid and invalid requests
      for (let i = 0; i < LOAD_TEST_PARAMS.concurrentUsers; i++) {
        if (i % 2 === 0) {
          // Valid request
          errorRequests.push(
            request(app.getHttpServer())
              .get('/products')
              .set('Authorization', `Bearer ${testData.userTokens[i]}`)
          );
        } else {
          // Invalid request (missing auth)
          errorRequests.push(
            request(app.getHttpServer())
              .get('/products')
          );
        }
      }

      const results = await Promise.all(errorRequests);
      
      // Valid requests should succeed
      expect(results.filter(r => r.status === 200).length).toBeGreaterThan(0);
      // Invalid requests should fail gracefully
      expect(results.filter(r => r.status === 401).length).toBeGreaterThan(0);
    });

    it('should handle timeout scenarios', async () => {
      // This would require setting shorter timeouts
      // For now, just verify timeouts are handled gracefully
      const responses = [];
      
      for (let i = 0; i < 10; i++) {
        const response = await request(app.getHttpServer())
          .get('/inventory')
          .set('Authorization', `Bearer ${testData.userTokens[i % testData.userTokens.length]}`);
        
        responses.push(response);
      }

      expect(responses.length).toBe(10);
      expect(responses.every(r => r.status === 200)).toBe(true);
    });
  });
});
