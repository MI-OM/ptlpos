import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  findAll(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async create(context: AuthContext, dto: CreateSupplierDto) {
    await this.ensureNoDuplicateSupplier(context.tenantId, dto);

    const supplier = await this.prisma.supplier.create({
      data: {
        tenantId: context.tenantId,
        name: dto.name,
        email: this.normalizeEmail(dto.email),
        phone: dto.phone?.trim(),
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'SUPPLIER_CREATED',
      entity: 'Supplier',
      entityId: supplier.id,
    });

    return supplier;
  }

  async update(context: AuthContext, id: string, dto: UpdateSupplierDto) {
    await this.findOne(context.tenantId, id);
    await this.ensureNoDuplicateSupplier(context.tenantId, dto, id);

    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        name: dto.name,
        email: this.normalizeEmail(dto.email),
        phone: dto.phone?.trim(),
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'SUPPLIER_UPDATED',
      entity: 'Supplier',
      entityId: supplier.id,
      metadata: dto as Prisma.JsonObject,
    });

    return supplier;
  }

  private async ensureNoDuplicateSupplier(
    tenantId: string,
    dto: { email?: string; phone?: string },
    excludeSupplierId?: string
  ) {
    const email = this.normalizeEmail(dto.email);
    const phone = dto.phone?.trim();

    const [duplicateEmail, duplicatePhone] = await Promise.all([
      email
        ? this.prisma.supplier.findFirst({
            where: {
              tenantId,
              email,
              id: excludeSupplierId ? { not: excludeSupplierId } : undefined,
            },
          })
        : Promise.resolve(null),
      phone
        ? this.prisma.supplier.findFirst({
            where: {
              tenantId,
              phone,
              id: excludeSupplierId ? { not: excludeSupplierId } : undefined,
            },
          })
        : Promise.resolve(null),
    ]);

    if (duplicateEmail) {
      throw new ConflictException('A supplier with this email already exists');
    }

    if (duplicatePhone) {
      throw new ConflictException('A supplier with this phone number already exists');
    }
  }

  private normalizeEmail(email?: string) {
    return email?.trim().toLowerCase();
  }
}
