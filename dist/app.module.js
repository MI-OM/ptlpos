"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./core/database/prisma.module");
const redis_module_1 = require("./core/database/redis.module");
const logging_interceptor_1 = require("./core/interceptors/logging.interceptor");
const performance_interceptor_1 = require("./core/interceptors/performance.interceptor");
const validation_exception_filter_1 = require("./core/filters/validation-exception.filter");
const http_exception_filter_1 = require("./core/filters/http-exception.filter");
const audit_module_1 = require("./modules/audit/audit.module");
const auth_module_1 = require("./modules/auth/auth.module");
const branches_module_1 = require("./modules/branches/branches.module");
const categories_module_1 = require("./modules/categories/categories.module");
const products_module_1 = require("./modules/products/products.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const customers_module_1 = require("./modules/customers/customers.module");
const sales_module_1 = require("./modules/sales/sales.module");
const payments_module_1 = require("./modules/payments/payments.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const health_module_1 = require("./modules/health/health.module");
const invoices_module_1 = require("./modules/invoices/invoices.module");
const suppliers_module_1 = require("./modules/suppliers/suppliers.module");
const purchase_orders_module_1 = require("./modules/purchase-orders/purchase-orders.module");
const purchases_module_1 = require("./modules/purchases/purchases.module");
const recipes_module_1 = require("./modules/recipes/recipes.module");
const production_module_1 = require("./modules/production/production.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const imports_module_1 = require("./modules/imports/imports.module");
const exports_module_1 = require("./modules/exports/exports.module");
const email_module_1 = require("./modules/email/email.module");
const metrics_module_1 = require("./modules/metrics/metrics.module");
const admin_module_1 = require("./modules/admin/admin.module");
const test_module_1 = require("./modules/test/test.module");
const shifts_module_1 = require("./modules/shifts/shifts.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
                {
                    ttl: 60000,
                    limit: 10,
                    name: 'auth',
                },
            ]),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            branches_module_1.BranchesModule,
            categories_module_1.CategoriesModule,
            products_module_1.ProductsModule,
            inventory_module_1.InventoryModule,
            customers_module_1.CustomersModule,
            sales_module_1.SalesModule,
            payments_module_1.PaymentsModule,
            analytics_module_1.AnalyticsModule,
            health_module_1.HealthModule,
            invoices_module_1.InvoicesModule,
            suppliers_module_1.SuppliersModule,
            purchase_orders_module_1.PurchaseOrdersModule,
            purchases_module_1.PurchasesModule,
            recipes_module_1.RecipesModule,
            production_module_1.ProductionModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            tenants_module_1.TenantsModule,
            imports_module_1.ImportsModule,
            exports_module_1.ExportsModule,
            email_module_1.EmailModule,
            metrics_module_1.MetricsModule,
            admin_module_1.AdminModule,
            test_module_1.TestModule,
            shifts_module_1.ShiftsModule,
            dashboard_module_1.DashboardModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: performance_interceptor_1.PerformanceInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: validation_exception_filter_1.ValidationExceptionFilter,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: http_exception_filter_1.HttpExceptionFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map