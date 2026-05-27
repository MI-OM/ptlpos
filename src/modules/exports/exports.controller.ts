import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { ExportsService } from './exports.service';

@ApiTags('exports')
@ApiBearerAuth()
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Export products data' })
  @ApiResponse({ status: 200, description: 'Products export file' })
  @Get('products')
  exportProducts(@CurrentUser() context: AuthContext) {
    return this.exportsService.exportProducts(context);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Export customers data' })
  @ApiResponse({ status: 200, description: 'Customers export file' })
  @Get('customers')
  exportCustomers(@CurrentUser() context: AuthContext) {
    return this.exportsService.exportCustomers(context);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Export suppliers data' })
  @ApiResponse({ status: 200, description: 'Suppliers export file' })
  @Get('suppliers')
  exportSuppliers(@CurrentUser() context: AuthContext) {
    return this.exportsService.exportSuppliers(context);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Export inventory data' })
  @ApiQuery({ name: 'branchId', required: false, type: String, example: 'branch-123', description: 'Filter by branch ID' })
  @ApiResponse({ status: 200, description: 'Inventory export file' })
  @Get('inventory')
  exportInventory(@CurrentUser() context: AuthContext, @Query('branchId') branchId?: string) {
    return this.exportsService.exportInventory(context, branchId);
  }
}
