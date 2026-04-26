import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { RoleName } from '@prisma/client';

@ApiBearerAuth()
@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'List all categories' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'bread' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, example: false })
  @ApiResponse({ status: 200, description: 'Categories list' })
  @Get()
  findAll(@CurrentUser() user: AuthContext, @Query() query: QueryCategoriesDto) {
    return this.categoriesService.findAll(user.tenantId, query);
  }

  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.categoriesService.findOne(user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post()
  create(@CurrentUser() user: AuthContext, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(user, createCategoryDto);
  }

  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user, id, updateCategoryDto);
  }

  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @Roles(RoleName.ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.categoriesService.remove(user, id);
  }
}
