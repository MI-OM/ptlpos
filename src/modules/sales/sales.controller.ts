import { Body, Controller, Delete, Get, Header, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { RoleName } from '@prisma/client';
import {
  AddSaleItemDto,
  CompleteSaleDto,
  CreateSaleDto,
  RefundSaleDto,
  QuerySalesDto,
} from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({
    status: 201,
    description: 'Sale created successfully',
    schema: {
      example: {
        id: 'sale-123',
        status: 'ACTIVE',
        totalAmount: 99.99,
        subtotal: 89.99,
        tax: 10.00,
        discount: 0.00,
        items: [],
        tenantId: 'tenant-123',
        branchId: 'branch-123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateSaleDto) {
    return this.salesService.create(user, dto);
  }

  @ApiOperation({ summary: 'List sales with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 15 })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'HELD', 'COMPLETED', 'CANCELLED', 'REFUNDED'], example: 'COMPLETED' })
  @ApiResponse({
    status: 200,
    description: 'List of sales with pagination metadata',
    schema: {
      example: {
        data: [
          {
            id: 'sale-123',
            status: 'COMPLETED',
            totalAmount: 99.99,
            subtotal: 89.99,
            tax: 10.00,
            discount: 0.00,
            saleNumber: 'SAL-20240101-0001',
            createdAt: '2024-01-01T00:00:00Z',
            items: [],
            customer: null,
          },
        ],
        meta: {
          page: 1,
          limit: 15,
          total: 100,
          totalPages: 7,
        },
      },
    },
  })
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Get()
  findAll(@CurrentUser() user: AuthContext, @Query() query: QuerySalesDto) {
    return this.salesService.findAll(user.tenantId, user.branchId, query);
  }

  @ApiOperation({ summary: 'Get sale by ID' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: 200,
    description: 'Sale details',
    schema: {
      example: {
        id: 'sale-123',
        status: 'COMPLETED',
        totalAmount: 99.99,
        subtotal: 89.99,
        tax: 10.00,
        discount: 0.00,
        items: [
          {
            id: 'item-123',
            productId: 'product-123',
            quantity: 2,
            unitPrice: 44.99,
            totalPrice: 89.98,
            product: { name: 'Bread Loaf', sku: 'BREAD-001' },
          },
        ],
        tenantId: 'tenant-123',
        branchId: 'branch-123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.findOne(user.tenantId, id, user.branchId);
  }

  @ApiOperation({ summary: 'Add item to sale' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: 200,
    description: 'Item added to sale',
    schema: {
      example: {
        id: 'item-123',
        productId: 'product-123',
        quantity: 2,
        unitPrice: 44.99,
        totalPrice: 89.98,
        saleId: 'sale-123',
        product: { name: 'Bread Loaf', sku: 'BREAD-001' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Post(':id/items')
  addItem(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: AddSaleItemDto) {
    return this.salesService.addItem(user, id, dto);
  }

  @ApiOperation({ summary: 'Remove item from sale' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiParam({ name: 'saleItemId', description: 'Sale Item ID' })
  @ApiResponse({ status: 200, description: 'Item removed from sale' })
  @ApiResponse({ status: 404, description: 'Sale or item not found' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Delete(':id/items/:saleItemId')
  removeItem(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Param('saleItemId') saleItemId: string
  ) {
    return this.salesService.removeItem(user, id, saleItemId);
  }

  @ApiOperation({ summary: 'Hold a sale' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: 200,
    description: 'Sale held successfully',
    schema: {
      example: {
        id: 'sale-123',
        status: 'HELD',
        totalAmount: 99.99,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Post(':id/hold')
  hold(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.hold(user, id);
  }

  @ApiOperation({ summary: 'Resume a held sale' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: 200,
    description: 'Sale resumed successfully',
    schema: {
      example: {
        id: 'sale-123',
        status: 'ACTIVE',
        totalAmount: 99.99,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Post(':id/resume')
  resume(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.resume(user, id);
  }

  @ApiOperation({ summary: 'Complete a sale' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: 200,
    description: 'Sale completed successfully',
    schema: {
      example: {
        id: 'sale-123',
        status: 'COMPLETED',
        totalAmount: 99.99,
        paymentMethod: 'CASH',
        completedAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Post(':id/complete')
  complete(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: CompleteSaleDto
  ) {
    return this.salesService.complete(user, id, dto);
  }

  @ApiOperation({ summary: 'Cancel a sale' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: 200,
    description: 'Sale cancelled successfully',
    schema: {
      example: {
        id: 'sale-123',
        status: 'CANCELLED',
        cancelledAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.cancel(user, id);
  }

  @ApiOperation({ summary: 'Refund a sale' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: 200,
    description: 'Sale refunded successfully',
    schema: {
      example: {
        id: 'sale-123',
        status: 'REFUNDED',
        refundAmount: 99.99,
        refundReason: 'Customer request',
        refundedAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post(':id/refund')
  refund(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: RefundSaleDto) {
    return this.salesService.refund(user, id, dto);
  }

  @ApiOperation({ summary: 'Get sale receipt' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: 200,
    description: 'Sale receipt data',
    schema: {
      example: {
        sale: {
          id: 'sale-123',
          totalAmount: 99.99,
          status: 'COMPLETED',
          completedAt: '2024-01-01T00:00:00Z',
        },
        items: [
          {
            name: 'Bread Loaf',
            quantity: 2,
            unitPrice: 44.99,
            totalPrice: 89.98,
          },
        ],
        tenant: { name: 'OM Mart' },
        branch: { name: 'Main Store' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Get(':id/receipt')
  receipt(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.receipt(user, id);
  }

  @ApiOperation({ summary: 'Get printable receipt HTML' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: 200,
    description: 'HTML receipt for printing',
    content: { 'text/html': {} },
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Get(':id/receipt/print')
  @Header('Content-Type', 'text/html; charset=utf-8')
  printableReceipt(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.printableReceipt(user, id);
  }

  @ApiOperation({ summary: 'Get receipt print job data' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: 200,
    description: 'Print job formatted receipt',
    content: { 'text/html': {} },
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Get(':id/receipt/print-job')
  @Header('Content-Type', 'text/html; charset=utf-8')
  receiptPrintJob(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.salesService.receiptPrintJob(user, id);
  }
}
