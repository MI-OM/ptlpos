import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { RoleName } from '@prisma/client';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminUser: any;
  let managerUser: any;
  let salesUser: any;

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
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.role.deleteMany();

    // Create roles
    await prisma.role.createMany({
      data: [
        { name: RoleName.ADMIN },
        { name: RoleName.MANAGER },
        { name: RoleName.SALES_REP },
      ],
    });

    // Create test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        email: 'test@tenant.com',
      },
    });

    const adminRole = await prisma.role.findUnique({
      where: { name: RoleName.ADMIN },
    });
    const managerRole = await prisma.role.findUnique({
      where: { name: RoleName.MANAGER },
    });
    const salesRole = await prisma.role.findUnique({
      where: { name: RoleName.SALES_REP },
    });

    // Create test users
    const passwordHash = await bcrypt.hash('TestPass123!', 10);

    adminUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        roleId: adminRole!.id,
        name: 'Test Admin',
        email: 'admin@test.com',
        passwordHash,
      },
    });

    managerUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        roleId: managerRole!.id,
        name: 'Test Manager',
        email: 'manager@test.com',
        passwordHash,
      },
    });

    salesUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        roleId: salesRole!.id,
        name: 'Test Sales',
        email: 'sales@test.com',
        passwordHash,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('/api/auth/login (POST)', () => {
    it('should login admin user successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'TestPass123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('admin@test.com');
          expect(res.body.user.role).toBe('ADMIN');
        });
    });

    it('should login manager user successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'TestPass123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user.role).toBe('MANAGER');
        });
    });

    it('should login sales user successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'sales@test.com',
          password: 'TestPass123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user.role).toBe('SALES_REP');
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestPass123!',
        })
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    let adminToken: string;
    let managerToken: string;
    let salesToken: string;

    beforeAll(async () => {
      // Get tokens for different users
      const adminResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'TestPass123!',
        });
      adminToken = adminResponse.body.access_token;

      const managerResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'TestPass123!',
        });
      managerToken = managerResponse.body.access_token;

      const salesResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'sales@test.com',
          password: 'TestPass123!',
        });
      salesToken = salesResponse.body.access_token;
    });

    describe('/api/users (GET)', () => {
      it('should allow admin to list users', () => {
        return request(app.getHttpServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
          });
      });

      it('should deny manager access to user management', () => {
        return request(app.getHttpServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${managerToken}`)
          .expect(403);
      });

      it('should deny sales rep access to user management', () => {
        return request(app.getHttpServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${salesToken}`)
          .expect(403);
      });
    });

    describe('/api/products (GET)', () => {
      it('should allow all roles to view products', () => {
        return request(app.getHttpServer())
          .get('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });

      it('should allow manager to view products', () => {
        return request(app.getHttpServer())
          .get('/api/products')
          .set('Authorization', `Bearer ${managerToken}`)
          .expect(200);
      });

      it('should allow sales rep to view products', () => {
        return request(app.getHttpServer())
          .get('/api/products')
          .set('Authorization', `Bearer ${salesToken}`)
          .expect(200);
      });
    });
  });
});