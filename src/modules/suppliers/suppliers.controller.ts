import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthContext } from '../../core/types/request-context';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthContext) {
    return this.suppliersService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.suppliersService.findOne(user.tenantId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto
  ) {
    return this.suppliersService.update(user, id, dto);
  }
}
