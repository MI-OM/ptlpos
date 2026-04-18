import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Public } from 'src/core/decorators/public.decorator';
import { AuthContext } from 'src/core/types/request-context';
import { RoleName } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { CompositeProductDto } from './dto/composite-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'List all products' })
  @ApiResponse({ status: 200, description: 'Products list' })
  @Get()
  findAll(@CurrentUser() user: AuthContext, @Query() query: QueryProductsDto) {
    return this.productsService.findAll(user.tenantId, query);
  }

  @ApiOperation({ summary: 'Create a simple or variant product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateProductDto) {
    return this.productsService.create(user, dto);
  }

  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Patch(':id')
  update(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(user, id, dto);
  }

  @ApiOperation({ summary: 'Create a composite product (bundle)' })
  @ApiResponse({
    status: 201,
    description: 'Composite product created',
    example: {
      id: 'prod-123',
      name: 'Bread Bundle',
      sku: 'BREAD-BUNDLE',
      type: 'COMPOSITE',
      price: 99.99,
      compositeParent: [
        {
          childProductId: 'bread-white',
          quantity: 2,
          child: { id: 'bread-white', name: 'White Loaf', sku: 'BREAD-W' },
        },
        {
          childProductId: 'bread-brown',
          quantity: 1,
          child: { id: 'bread-brown', name: 'Brown Loaf', sku: 'BREAD-B' },
        },
      ],
    },
  })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('composite')
  createComposite(@CurrentUser() user: AuthContext, @Body() dto: CompositeProductDto) {
    return this.productsService.createComposite(user, dto);
  }

  @ApiOperation({ summary: 'Get composite product details with components' })
  @ApiParam({ name: 'id', description: 'Composite product ID' })
  @ApiResponse({
    status: 200,
    description: 'Composite product details',
  })
  @Get('composite/:id')
  getComposite(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.productsService.getComposite(user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get composite product with component inventory levels' })
  @ApiParam({ name: 'id', description: 'Composite product ID' })
  @ApiResponse({
    status: 200,
    description: 'Composite product with inventory',
    example: {
      id: 'prod-123',
      name: 'Bread Bundle',
      allComponentsAvailable: true,
      compositeParent: [
        {
          component: { id: 'bread-white', name: 'White Loaf' },
          quantity: 2,
          availableStock: 10,
          canFulfill: true,
        },
      ],
    },
  })
  @Get('composite/:id/inventory')
  getCompositeWithInventory(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.productsService.getCompositeWithInventory(user.tenantId, id);
  }

  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @Roles(RoleName.ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.productsService.remove(user, id);
  }
}
