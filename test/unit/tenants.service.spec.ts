import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from 'src/modules/tenants/tenants.service';

describe('TenantsService', () => {
  let prisma: {
    tenant: { findFirst: jest.Mock; create: jest.Mock; findUnique: jest.Mock };
  };
  let service: TenantsService;

  beforeEach(() => {
    prisma = {
      tenant: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    service = new TenantsService(prisma as never);
  });

  it('rejects duplicate tenant names', async () => {
    prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });

    await expect(service.create({ name: 'PTLPOS' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns the authenticated tenant', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1', name: 'PTLPOS' });

    const result = await service.me({
      tenantId: 'tenant-1',
      userId: 'user-1',
      role: 'ADMIN',
    } as never);

    expect(result).toEqual({ id: 'tenant-1', name: 'PTLPOS' });
  });

  it('throws when the authenticated tenant is missing', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);

    await expect(
      service.me({
        tenantId: 'tenant-1',
        userId: 'user-1',
        role: 'ADMIN',
      } as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
