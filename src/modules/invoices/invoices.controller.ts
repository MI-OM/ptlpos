import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthContext } from '../../core/types/request-context';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicesService } from './invoices.service';
import { Response } from 'express';

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

  @Get(':id/a4')
  async generateA4Invoice(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const html = await this.invoicesService.generateA4InvoiceHTML(user.tenantId, id);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.html"`);
    res.send(html);
  }
}
