import { AuditService } from 'src/modules/audit/audit.service';

describe('AuditService', () => {
  let prisma: {
    auditLog: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let service: AuditService;

  beforeEach(() => {
    prisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new AuditService(prisma as never);
  });

  it('writes audit log entries', async () => {
    prisma.auditLog.create.mockResolvedValue({ id: 'log-1' });

    await service.log({
      tenantId: 'tenant-1',
      userId: 'user-1',
      action: 'SALE_CREATED',
      entity: 'Sale',
      entityId: 'sale-1',
      metadata: {
        total: 50,
      },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'SALE_CREATED',
        entity: 'Sale',
        entityId: 'sale-1',
        metadata: {
          total: 50,
        },
      },
    });
  });

  it('returns paginated tenant-scoped audit logs', async () => {
    prisma.$transaction.mockResolvedValue([
      [
        {
          id: 'log-1',
          userId: 'user-1',
          action: 'SALE_CREATED',
          entity: 'Sale',
          entityId: 'sale-1',
          timestamp: new Date('2026-04-10T12:00:00.000Z'),
          metadata: { entityName: 'Sale #1' },
          user: {
            name: 'Admin User',
            email: 'admin@example.com',
          },
        },
      ],
      1,
    ]);

    const result = await service.findAll('tenant-1', {
      page: 2,
      limit: 5,
      entity: 'Sale',
      action: 'SALE_CREATED',
      from: '2026-04-01T00:00:00.000Z',
      to: '2026-04-30T23:59:59.999Z',
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual({
      data: [
        {
          id: 'log-1',
          userId: 'user-1',
          userName: 'Admin User',
          userEmail: 'admin@example.com',
          action: 'SALE_CREATED',
          entity: 'Sale',
          entityId: 'sale-1',
          entityName: 'Sale #1',
          timestamp: new Date('2026-04-10T12:00:00.000Z'),
          metadata: { entityName: 'Sale #1' },
        },
      ],
      meta: {
        page: 2,
        limit: 5,
        total: 1,
      },
    });
  });
});
