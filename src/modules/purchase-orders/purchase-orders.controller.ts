import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthContext } from '../../core/types/request-context';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthContext) {
    return this.purchaseOrdersService.findAll(user.tenantId, user.branchId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.purchaseOrdersService.findOne(user.tenantId, id, user.branchId);
  }

  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.create(user, dto);
  }
}
