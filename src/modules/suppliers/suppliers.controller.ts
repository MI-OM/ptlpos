import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { RoleName } from '@prisma/client';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @ApiOperation({ summary: 'List all suppliers' })
  @ApiResponse({ status: 200, description: 'Suppliers list' })
  @Get()
  findAll(@CurrentUser() user: AuthContext) {
    return this.suppliersService.findAll(user.tenantId);
  }

  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'Supplier details' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.suppliersService.findOne(user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(user, dto);
  }

  @ApiOperation({ summary: 'Update supplier information' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto
  ) {
    return this.suppliersService.update(user, id, dto);
  }

  @ApiOperation({ summary: 'Delete a supplier' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Delete(':id')
  remove(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.suppliersService.remove(user.tenantId, id);
  }
}
