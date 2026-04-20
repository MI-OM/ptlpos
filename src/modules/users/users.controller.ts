import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Get()
  @ApiOperation({
    summary: 'List all users in organization',
    description: 'Get all users for the current tenant. Requires ADMIN or MANAGER role.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    schema: {
      example: [
        {
          id: 'clh7x1q0b0000qa20f0f0f0f0',
          name: 'John Doe',
          email: 'john@example.com',
          tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
          role: { name: 'ADMIN' },
          createdAt: '2025-12-01T10:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  findAll(@CurrentUser() user: AuthContext) {
    return this.usersService.findAll(user.tenantId);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'clh7x1q0b0000qa20f0f0f0f0',
  })
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user. Requires ADMIN or MANAGER role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User details',
    schema: {
      example: {
        id: 'clh7x1q0b0000qa20f0f0f0f0',
        name: 'John Doe',
        email: 'john@example.com',
        tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
        role: { name: 'ADMIN' },
        createdAt: '2025-12-01T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.usersService.findOne(user.tenantId, id);
  }

  @Roles(RoleName.ADMIN)
  @Post()
  @ApiOperation({
    summary: 'Create new user',
    description: 'Create a new user in the organization. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        id: 'clh7x1q0c0000qa30f0f0f0f0',
        name: 'Jane Smith',
        email: 'jane@example.com',
        tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
        role: 'MANAGER',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or email already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Only ADMIN can create users',
  })
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateUserDto) {
    return this.usersService.create(user, dto);
  }

  @Roles(RoleName.ADMIN)
  @Patch(':id')
  @ApiParam({
    name: 'id',
    description: 'User ID to update',
    example: 'clh7x1q0b0000qa20f0f0f0f0',
  })
  @ApiOperation({
    summary: 'Update user',
    description: 'Update user details (name, email, password, or role). Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        id: 'clh7x1q0b0000qa20f0f0f0f0',
        name: 'John Doe Updated',
        email: 'john.new@example.com',
        tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
        role: 'MANAGER',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already in use by another user',
  })
  update(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user, id, dto);
  }

  @Roles(RoleName.ADMIN)
  @Delete(':id')
  @ApiParam({
    name: 'id',
    description: 'User ID to delete',
    example: 'clh7x1q0b0000qa20f0f0f0f0',
  })
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently delete a user. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      example: {
        message: 'User deleted successfully',
        id: 'clh7x1q0b0000qa20f0f0f0f0',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  delete(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.usersService.delete(user, id);
  }
}
