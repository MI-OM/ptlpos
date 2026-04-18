import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthContext } from 'src/core/types/request-context';
import { ExportsService } from './exports.service';

@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('products')
  exportProducts(@CurrentUser() context: AuthContext) {
    return this.exportsService.exportProducts(context);
  }

  @Get('customers')
  exportCustomers(@CurrentUser() context: AuthContext) {
    return this.exportsService.exportCustomers(context);
  }

  @Get('suppliers')
  exportSuppliers(@CurrentUser() context: AuthContext) {
    return this.exportsService.exportSuppliers(context);
  }

  @Get('inventory')
  exportInventory(@CurrentUser() context: AuthContext, @Query('branchId') branchId?: string) {
    return this.exportsService.exportInventory(context, branchId);
  }
}
