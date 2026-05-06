import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicesService } from './invoices.service';
import { Response } from 'express';
import { RoleName } from '@prisma/client';

@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @ApiOperation({ summary: 'List all invoices' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @Get()
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.invoicesService.findAll(user.tenantId, Number(page ?? 1), Number(limit ?? 20));
  }

  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.invoicesService.findOne(user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create invoice from sale' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(user, dto);
  }

  @ApiOperation({ summary: 'Generate A4 invoice HTML' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'HTML invoice generated', content: { 'text/html': {} } })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
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

  @ApiOperation({ summary: 'Generate invoice PDF' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'PDF invoice generated', content: { 'application/pdf': {} } })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @Get(':id/pdf')
  async generateInvoicePDF(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const pdfBuffer = await this.invoicesService.generateInvoicePDF(user.tenantId, id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.send(pdfBuffer);
  }

  @ApiOperation({ summary: 'Send invoice via email' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice sent successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 400, description: 'No email address available' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post(':id/send')
  async sendInvoice(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() body?: { email?: string }
  ) {
    return this.invoicesService.sendInvoiceEmail(user, id, body?.email);
  }
}
