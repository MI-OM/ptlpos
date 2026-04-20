import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { AuthContext } from '../../core/types/request-context';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantDetailsDto } from './dto/update-tenant-details.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Create new organization (tenant)',
    description:
      'Create a new tenant/organization. Use /auth/register instead for complete setup with admin user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    schema: {
      example: {
        id: 'clh7x1q0a0000qa10f0f0f0f0',
        name: 'Acme Corporation',
        createdAt: '2025-12-01T10:00:00Z',
        updatedAt: '2025-12-01T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Tenant with this name already exists',
  })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current organization details',
    description: 'Retrieve details of the current tenant. Requires authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization details',
    schema: {
      example: {
        id: 'clh7x1q0a0000qa10f0f0f0f0',
        name: 'Acme Corporation',
        createdAt: '2025-12-01T10:00:00Z',
        updatedAt: '2025-12-01T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid token',
  })
  me(@CurrentUser() user: AuthContext) {
    return this.tenantsService.me(user);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update current organization',
    description: 'Update organization details (name). Requires authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
    schema: {
      example: {
        id: 'clh7x1q0a0000qa10f0f0f0f0',
        name: 'Acme Corporation Updated',
        createdAt: '2025-12-01T10:00:00Z',
        updatedAt: '2025-12-01T11:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Organization name already in use',
  })
  update(@CurrentUser() user: AuthContext, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(user, dto);
  }

  @Patch('me/details')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update organization profile details',
    description:
      'Update detailed organization information including email, phone, website, logo, address, etc. Requires authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization details updated successfully',
    schema: {
      example: {
        id: 'clh7x1q0a0000qa10f0f0f0f0',
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-800-ACME-123',
        website: 'https://acme.com',
        logoUrl: 'https://cdn.example.com/logo.png',
        industry: 'Technology',
        address: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'United States',
        isEmailVerified: false,
        createdAt: '2025-12-01T10:00:00Z',
        updatedAt: '2025-12-01T11:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email already in use by another organization',
  })
  updateDetails(@CurrentUser() user: AuthContext, @Body() dto: UpdateTenantDetailsDto) {
    return this.tenantsService.updateDetails(user, dto);
  }
}
