import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaModule } from '../../core/database/prisma.module';
import { RedisModule } from '../../core/database/redis.module';
import { AuditModule } from '../audit/audit.module';
import { CategoriesModule } from '../categories/categories.module';
import { TenantAuthModule } from '../auth/tenant-auth.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuditModule,
    CategoriesModule,
    TenantAuthModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
