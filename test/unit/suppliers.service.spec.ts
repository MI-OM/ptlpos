import { ConflictException, NotFoundException } from '@nestjs/common';
import { SuppliersService } from 'src/modules/suppliers/suppliers.service';

describe('SuppliersService', () => {
  const context = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    role: 'ADMIN',
  } as const;

  let prisma: {
    supplier: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let audit: { log: jest.Mock };
  let service: SuppliersService;

  beforeEach(() => {
    prisma = {
      supplier: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    audit = { log: jest.fn() };
    service = new SuppliersService(prisma as never, audit as never);
  });

  it('rejects duplicate supplier email on create', async () => {
    prisma.supplier.findFirst.mockResolvedValueOnce({ id: 'supplier-1' });

    await expect(
      service.create(context, {
        name: 'Flour Mills',
        email: 'hello@example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates a supplier and normalizes email', async () => {
    prisma.supplier.findFirst.mockResolvedValue(null);
    prisma.supplier.create.mockResolvedValue({
      id: 'supplier-1',
      name: 'Flour Mills',
      email: 'hello@example.com',
    });

    const result = await service.create(context, {
      name: 'Flour Mills',
      email: ' Hello@Example.com ',
    });

    expect(prisma.supplier.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        name: 'Flour Mills',
        email: 'hello@example.com',
        phone: undefined,
      },
    });
    expect(audit.log).toHaveBeenCalled();
    expect(result.id).toBe('supplier-1');
  });

  it('throws when supplier is missing', async () => {
    prisma.supplier.findFirst.mockResolvedValue(null);

    await expect(service.findOne('tenant-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
