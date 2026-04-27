import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './core/database/prisma.module';
import { RedisModule } from './core/database/redis.module';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { PerformanceInterceptor } from './core/interceptors/performance.interceptor';
import { ValidationExceptionFilter } from './core/filters/validation-exception.filter';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { RequestContextGuard } from './core/guards/request-context.guard';
import { RolesGuard } from './core/guards/roles.guard';
import { BypassAuthGuard } from './core/guards/bypass-auth.guard';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SalesModule } from './modules/sales/sales.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { ProductionModule } from './modules/production/production.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ImportsModule } from './modules/imports/imports.module';
import { ExportsModule } from './modules/exports/exports.module';
import { EmailModule } from './modules/email/email.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { AdminModule } from './modules/admin/admin.module';
import { TestModule } from './modules/test/test.module';
import { ShiftsModule } from './modules/shifts/shifts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        ttl: 60000, // 1 minute  
        limit: 10, // 10 requests per minute for auth endpoints
        name: 'auth',
      },
    ]),
    PrismaModule,
    RedisModule,
    AuditModule,
    AuthModule,
    BranchesModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    CustomersModule,
    SalesModule,
    PaymentsModule,
    AnalyticsModule,
    HealthModule,
    InvoicesModule,
    SuppliersModule,
    PurchaseOrdersModule,
    PurchasesModule,
    RecipesModule,
    ProductionModule,
    UsersModule,
    RolesModule,
    TenantsModule,
    ImportsModule,
    ExportsModule,
    EmailModule,
    MetricsModule,
    AdminModule,
    TestModule,
    ShiftsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
