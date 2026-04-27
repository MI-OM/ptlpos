import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { RoleName } from '@prisma/client';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ summary: 'List all customers' })
  @ApiResponse({
    status: 200,
    description: 'List of all customers for the current tenant',
    schema: {
      example: [
        {
          id: 'customer-123',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          tenantId: 'tenant-123',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    },
  })
  @Get()
  findAll(@CurrentUser() user: AuthContext) {
    return this.customersService.findAll(user.tenantId);
  }

  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer details',
    schema: {
      example: {
        id: 'customer-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        tenantId: 'tenant-123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.customersService.findOne(user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get customer purchase history' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Customer purchase history',
    schema: {
      example: {
        data: [
          {
            id: 'sale-123',
            customerId: 'customer-123',
            totalAmount: 99.99,
            status: 'COMPLETED',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @Get(':id/history')
  history(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.customersService.history(user.tenantId, id, Number(page ?? 1), Number(limit ?? 20));
  }

  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    schema: {
      example: {
        id: 'customer-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        tenantId: 'tenant-123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user, dto);
  }

  @ApiOperation({ summary: 'Update customer information' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully',
    schema: {
      example: {
        id: 'customer-123',
        name: 'John Updated',
        email: 'john.updated@example.com',
        phone: '+1234567890',
        address: '456 Updated St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'USA',
        tenantId: 'tenant-123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto
  ) {
    return this.customersService.update(user, id, dto);
  }

  @ApiOperation({ summary: 'Delete a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Delete(':id')
  remove(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.customersService.remove(user.tenantId, id);
  }
}
