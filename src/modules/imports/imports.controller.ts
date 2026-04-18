import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthContext } from 'src/core/types/request-context';
import { ImportProductsDto } from './dto/import-products.dto';
import { ImportCustomersDto } from './dto/import-customers.dto';
import { ImportSuppliersDto } from './dto/import-suppliers.dto';
import { ImportsService } from './imports.service';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('products')
  importProducts(@CurrentUser() context: AuthContext, @Body() dto: ImportProductsDto) {
    return this.importsService.importProducts(context, dto);
  }

  @Post('customers')
  importCustomers(@CurrentUser() context: AuthContext, @Body() dto: ImportCustomersDto) {
    return this.importsService.importCustomers(context, dto);
  }

  @Post('suppliers')
  importSuppliers(@CurrentUser() context: AuthContext, @Body() dto: ImportSuppliersDto) {
    return this.importsService.importSuppliers(context, dto);
  }
}
