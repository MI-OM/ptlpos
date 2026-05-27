import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { ImportProductsDto } from './dto/import-products.dto';
import { ImportCustomersDto } from './dto/import-customers.dto';
import { ImportSuppliersDto } from './dto/import-suppliers.dto';
import { ImportsService } from './imports.service';

@ApiTags('Imports')
@ApiBearerAuth()
@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('products')
  importProducts(@CurrentUser() context: AuthContext, @Body() dto: ImportProductsDto) {
    return this.importsService.importProducts(context, dto);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('customers')
  importCustomers(@CurrentUser() context: AuthContext, @Body() dto: ImportCustomersDto) {
    return this.importsService.importCustomers(context, dto);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('suppliers')
  importSuppliers(@CurrentUser() context: AuthContext, @Body() dto: ImportSuppliersDto) {
    return this.importsService.importSuppliers(context, dto);
  }
}
