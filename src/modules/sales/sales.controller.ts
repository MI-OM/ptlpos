import { Body, Controller, Delete, Get, Header, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthContext } from '../../core/types/request-context';
import {
  AddSaleItemDto,
  CompleteSaleDto,
  CreateSaleDto,
  RefundSaleDto,
} from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateSaleDto) {
    return this.salesService.create(user, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.findOne(user.tenantId, id, user.branchId);
  }

  @Post(':id/items')
  addItem(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: AddSaleItemDto) {
    return this.salesService.addItem(user, id, dto);
  }

  @Delete(':id/items/:saleItemId')
  removeItem(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Param('saleItemId') saleItemId: string
  ) {
    return this.salesService.removeItem(user, id, saleItemId);
  }

  @Post(':id/hold')
  hold(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.hold(user, id);
  }

  @Post(':id/resume')
  resume(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.resume(user, id);
  }

  @Post(':id/complete')
  complete(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: CompleteSaleDto
  ) {
    return this.salesService.complete(user, id, dto);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.cancel(user, id);
  }

  @Post(':id/refund')
  refund(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: RefundSaleDto) {
    return this.salesService.refund(user, id, dto);
  }

  @Get(':id/receipt')
  receipt(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.receipt(user, id);
  }

  @Get(':id/receipt/print')
  @Header('Content-Type', 'text/html; charset=utf-8')
  printableReceipt(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.printableReceipt(user, id);
  }

  @Get(':id/receipt/print-job')
  @Header('Content-Type', 'text/html; charset=utf-8')
  receiptPrintJob(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.receiptPrintJob(user, id);
  }
}
