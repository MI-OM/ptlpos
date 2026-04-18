import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { AuthContext } from 'src/core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  findAll(tenantId: string) {
    return this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            sales: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async history(tenantId: string, id: string, page = 1, limit = 20) {
    await this.findOne(tenantId, id);

    const skip = (page - 1) * limit;
    const [sales, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where: {
          tenantId,
          customerId: id,
        },
        include: {
          items: {
            include: {
              product: true,
              productVariant: true,
            },
          },
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.sale.count({
        where: {
          tenantId,
          customerId: id,
        },
      }),
    ]);

    return {
      data: sales,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async create(context: AuthContext, dto: CreateCustomerDto) {
    await this.ensureNoDuplicateCustomer(context.tenantId, dto);

    const customer = await this.prisma.customer.create({
      data: {
        tenantId: context.tenantId,
        ...dto,
        email: this.normalizeEmail(dto.email),
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'CUSTOMER_CREATED',
      entity: 'Customer',
      entityId: customer.id,
    });

    return customer;
  }

  async update(context: AuthContext, id: string, dto: UpdateCustomerDto) {
    await this.findOne(context.tenantId, id);
    await this.ensureNoDuplicateCustomer(context.tenantId, dto, id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        email: this.normalizeEmail(dto.email),
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'CUSTOMER_UPDATED',
      entity: 'Customer',
      entityId: id,
      metadata: dto as Prisma.JsonObject,
    });

    return customer;
  }

  private async ensureNoDuplicateCustomer(
    tenantId: string,
    dto: { email?: string; phone?: string },
    excludeCustomerId?: string
  ) {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const phone = dto.phone?.trim();

    const duplicateChecks = [
      normalizedEmail
        ? this.prisma.customer.findFirst({
            where: {
              tenantId,
              email: normalizedEmail,
              id: excludeCustomerId ? { not: excludeCustomerId } : undefined,
            },
          })
        : Promise.resolve(null),
      phone
        ? this.prisma.customer.findFirst({
            where: {
              tenantId,
              phone,
              id: excludeCustomerId ? { not: excludeCustomerId } : undefined,
            },
          })
        : Promise.resolve(null),
    ] as const;

    const [duplicateEmailCustomer, duplicatePhoneCustomer] = await Promise.all(duplicateChecks);

    if (duplicateEmailCustomer) {
      throw new ConflictException('A customer with this email already exists');
    }

    if (duplicatePhoneCustomer) {
      throw new ConflictException('A customer with this phone number already exists');
    }
  }

  private normalizeEmail(email?: string) {
    return email?.trim().toLowerCase();
  }
}
