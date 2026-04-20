import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthContext } from '../../core/types/request-context';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.invoicesService.findAll(user.tenantId, Number(page ?? 1), Number(limit ?? 20));
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.invoicesService.findOne(user.tenantId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(user, dto);
  }
}
