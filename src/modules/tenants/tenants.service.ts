import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantDetailsDto } from './dto/update-tenant-details.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findFirst({
      where: {
        name: dto.name,
      },
    });

    if (existing) {
      throw new ConflictException('A tenant with this name already exists');
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
      },
    });
  }

  async me(context: AuthContext) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: context.tenantId,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(context: AuthContext, dto: UpdateTenantDto) {
    if (dto.name) {
      const existing = await this.prisma.tenant.findFirst({
        where: {
          name: dto.name,
          id: { not: context.tenantId },
        },
      });

      if (existing) {
        throw new ConflictException('A tenant with this name already exists');
      }
    }

    return this.prisma.tenant.update({
      where: { id: context.tenantId },
      data: dto,
    });
  }

  async updateDetails(context: AuthContext, dto: UpdateTenantDetailsDto) {
    // Check for email conflicts if updating email
    if (dto.email) {
      const existing = await this.prisma.tenant.findFirst({
        where: {
          email: dto.email,
          id: { not: context.tenantId },
        },
      });

      if (existing) {
        throw new ConflictException('This email is already in use by another organization');
      }
    }

    return this.prisma.tenant.update({
      where: { id: context.tenantId },
      data: {
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        logoUrl: dto.logoUrl,
        industry: dto.industry,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        country: dto.country,
      },
    });
  }
}
