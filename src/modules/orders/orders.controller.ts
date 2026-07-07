import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAll(user.tenantId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 15,
      status,
    });
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.ordersService.findOne(user.tenantId, id);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user, dto);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.update(user.tenantId, id, dto);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.ordersService.cancel(user.tenantId, id);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post(':id/fulfill')
  fulfill(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.ordersService.fulfill(user.tenantId, id);
  }
}
