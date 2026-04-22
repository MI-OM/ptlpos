import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { CreateBranchDto, UpdateBranchDto } from './dto/create-branch.dto';
import { BranchesService } from './branches.service';

@ApiTags('branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @ApiOperation({ summary: 'List all branches' })
  @ApiResponse({
    status: 200,
    description: 'List of all branches for the current tenant',
    schema: {
      example: [
        {
          id: 'branch-123',
          name: 'Main Store',
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
    return this.branchesService.findAll(user.tenantId);
  }

  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiResponse({
    status: 200,
    description: 'Branch details',
    schema: {
      example: {
        id: 'branch-123',
        name: 'Main Store',
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
  @ApiResponse({ status: 404, description: 'Branch not found' })
  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.branchesService.findOne(user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({
    status: 201,
    description: 'Branch created successfully',
    schema: {
      example: {
        id: 'branch-123',
        name: 'Main Store',
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
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateBranchDto) {
    return this.branchesService.create(user, dto);
  }

  @ApiOperation({ summary: 'Update a branch' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiResponse({
    status: 200,
    description: 'Branch updated successfully',
    schema: {
      example: {
        id: 'branch-123',
        name: 'Updated Store',
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
  @ApiResponse({ status: 404, description: 'Branch not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Put(':id')
  update(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(user, id, dto);
  }

  @ApiOperation({ summary: 'Delete a branch' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Branch deleted successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Roles(RoleName.ADMIN)
  @Delete(':id')
  delete(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.branchesService.delete(user, id);
  }
}
