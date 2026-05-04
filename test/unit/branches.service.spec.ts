import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AuditService } from '../../src/modules/audit/audit.service';
import { BranchesService } from '../../src/modules/branches/branches.service';

describe('BranchesService', () => {
  let service: BranchesService;
  let prisma: any;
  let audit: { log: jest.Mock };

  const mockTenantId = 'test-tenant-id';
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    prisma = {
      branch: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      inventory: {
        count: jest.fn(),
      },
      sale: {
        count: jest.fn(),
      },
    } as any;

    audit = {
      log: jest.fn(),
    };

    service = new BranchesService(prisma as never, audit as unknown as AuditService);
  });

  it('creates a branch successfully', async () => {
    prisma.branch.findFirst.mockResolvedValueOnce(null as any);
    prisma.branch.create.mockResolvedValue({
      id: 'branch-1',
      tenantId: mockTenantId,
      name: 'Test Branch',
    } as any);

    const result = await service.create(
      { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
      {
        name: 'Test Branch',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
      },
    );

    expect(prisma.branch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: mockTenantId,
        name: 'Test Branch',
      }),
    });
    expect(audit.log).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: 'branch-1',
        tenantId: mockTenantId,
      }),
    );
  });

  it('rejects duplicate branch names within a tenant', async () => {
    prisma.branch.findFirst.mockResolvedValue({ id: 'existing-branch' } as any);

    await expect(
      service.create(
        { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
        {
          name: 'Test Branch',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country',
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns all branches for a tenant', async () => {
    prisma.branch.findMany.mockResolvedValue([{ id: 'branch-1' }, { id: 'branch-2' }] as any);

    const result = await service.findAll(mockTenantId);

    expect(prisma.branch.findMany).toHaveBeenCalledWith({
      where: { tenantId: mockTenantId },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toHaveLength(2);
  });

  it('returns a branch by id', async () => {
    prisma.branch.findFirst.mockResolvedValue({ id: 'branch-1', _count: {} } as any);

    const result = await service.findOne(mockTenantId, 'branch-1');

    expect(prisma.branch.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'branch-1',
        tenantId: mockTenantId,
      },
      include: {
        _count: {
          select: {
            inventories: true,
            sales: true,
            purchaseOrders: true,
          },
        },
      },
    });
    expect(result).toEqual(expect.objectContaining({ id: 'branch-1' }));
  });

  it('throws when branch is not found', async () => {
    prisma.branch.findFirst.mockResolvedValue(null as any);

    await expect(service.findOne(mockTenantId, 'missing-branch')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates a branch successfully', async () => {
    prisma.branch.findFirst.mockResolvedValueOnce({ id: 'branch-1', _count: {} } as any);
    prisma.branch.findFirst.mockResolvedValueOnce(null as any);
    prisma.branch.update.mockResolvedValue({ id: 'branch-1', name: 'Updated Branch' } as any);

    const result = await service.update(
      { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
      'branch-1',
      { name: 'Updated Branch' },
    );

    expect(prisma.branch.update).toHaveBeenCalledWith({
      where: { id: 'branch-1' },
      data: { name: 'Updated Branch' },
    });
    expect(audit.log).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ id: 'branch-1' }));
  });

  it('deletes a branch with no inventory or sales data', async () => {
    prisma.branch.findFirst.mockResolvedValue({ id: 'branch-1', _count: {} } as any);
    prisma.inventory.count.mockResolvedValue(0 as any);
    prisma.sale.count.mockResolvedValue(0 as any);
    prisma.branch.delete.mockResolvedValue({ id: 'branch-1' } as any);

    const result = await service.delete(
      { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
      'branch-1',
    );

    expect(prisma.branch.delete).toHaveBeenCalledWith({
      where: { id: 'branch-1' },
    });
    expect(result).toEqual({ success: true });
  });

  it('rejects deleting a branch with inventory or sales data', async () => {
    prisma.branch.findFirst.mockResolvedValue({ id: 'branch-1', _count: {} } as any);
    prisma.inventory.count.mockResolvedValue(1 as any);
    prisma.sale.count.mockResolvedValue(0 as any);

    await expect(
      service.delete(
        { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
        'branch-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
