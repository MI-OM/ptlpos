import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthContext } from '../../core/types/request-context';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthContext) {
    return this.customersService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.customersService.findOne(user.tenantId, id);
  }

  @Get(':id/history')
  history(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.customersService.history(user.tenantId, id, Number(page ?? 1), Number(limit ?? 20));
  }

  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto
  ) {
    return this.customersService.update(user, id, dto);
  }
}
