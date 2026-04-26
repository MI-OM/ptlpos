import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UploadedFiles } from '@nestjs/common';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { AuthContext } from '../../core/types/request-context';
import { RoleName } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { CompositeProductDto } from './dto/composite-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadProductImageDto } from './dto/upload-product-image.dto';
import { UploadProductImageResponseDto } from './dto/upload-product-image-response.dto';
import { ProductsService } from './products.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'List all products' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 15 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'laptop' })
  @ApiQuery({ name: 'categoryId', required: false, type: String, example: 'category-123' })
  @ApiQuery({ name: 'type', required: false, enum: ['SIMPLE', 'VARIANT', 'COMPOSITE'], example: 'SIMPLE' })
  @ApiQuery({ name: 'includeVariants', required: false, type: Boolean, example: false })
  @ApiQuery({ name: 'includeInventory', required: false, type: Boolean, example: true })
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

  @ApiOperation({ summary: 'Upload product image' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product image uploaded successfully',
    type: UploadProductImageResponseDto,
  })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post(':id/upload-image')
  uploadProductImage(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() uploadDto: UploadProductImageDto,
  ) {
    return this.productsService.uploadProductImage(user, id, uploadDto);
  }

  @ApiOperation({ summary: 'Upload multiple product images' })
  @ApiResponse({ status: 200, description: 'Images uploaded successfully', type: UploadProductImageResponseDto })
  @UseInterceptors(FilesInterceptor('files'))
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post(':id/upload-images')
  async uploadMultipleProductImages(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @UploadedFiles() files: MulterFile[],
    @Body() metadata?: { alt?: string; caption?: string; tags?: string[] },
  ) {
    return this.productsService.uploadMultipleProductImages(user, id, files, metadata);
  }

  @ApiOperation({ summary: 'Delete product image' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiParam({ name: 'imageId', description: 'Image ID' })
  @ApiResponse({
    status: 200,
    description: 'Product image deleted successfully',
  })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Delete(':id/images/:imageId')
  deleteProductImage(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.deleteProductImage(user, id, imageId);
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
