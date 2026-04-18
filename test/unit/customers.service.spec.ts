import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomersService } from 'src/modules/customers/customers.service';

describe('CustomersService', () => {
  const context = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    role: 'ADMIN',
  } as const;

  let prisma: {
    customer: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    sale: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let audit: {
    log: jest.Mock;
  };
  let service: CustomersService;

  beforeEach(() => {
    prisma = {
      customer: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      sale: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    audit = {
      log: jest.fn(),
    };

    service = new CustomersService(prisma as never, audit as never);
  });

  it('returns a customer for the tenant', async () => {
    prisma.customer.findFirst.mockResolvedValue({
      id: 'customer-1',
      name: 'Ada',
      _count: { sales: 2 },
    });

    const result = await service.findOne('tenant-1', 'customer-1');

    expect(prisma.customer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'customer-1',
          tenantId: 'tenant-1',
        },
      }),
    );
    expect(result).toEqual({
      id: 'customer-1',
      name: 'Ada',
      _count: { sales: 2 },
    });
  });

  it('throws when the customer is not found', async () => {
    prisma.customer.findFirst.mockResolvedValue(null);

    await expect(service.findOne('tenant-1', 'customer-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns paginated customer sale history', async () => {
    prisma.customer.findFirst.mockResolvedValue({
      id: 'customer-1',
      name: 'Ada',
      _count: { sales: 1 },
    });
    prisma.$transaction.mockResolvedValue([
      [{ id: 'sale-1', customerId: 'customer-1' }],
      1,
    ]);

    const result = await service.history('tenant-1', 'customer-1', 2, 5);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual({
      data: [{ id: 'sale-1', customerId: 'customer-1' }],
      meta: {
        page: 2,
        limit: 5,
        total: 1,
      },
    });
  });

  it('rejects customer creation when the email already exists in the tenant', async () => {
    prisma.customer.findFirst.mockResolvedValueOnce({
      id: 'customer-existing',
      email: 'ada@example.com',
    });

    await expect(
      service.create(context, {
        name: 'Ada',
        email: 'Ada@Example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects customer creation when the phone already exists in the tenant', async () => {
    // Mock the first call for email check to return null, second call for phone check to return a customer
    let callCount = 0;
    prisma.customer.findFirst.mockImplementation(async (query: any) => {
      callCount++;
      // Check which query this is by examining the where clause
      const hasEmail = query.where.email;
      const hasPhone = query.where.phone;
      
      if (hasPhone && hasPhone === '08010000000') {
        // Phone duplicate check - return a duplicate customer
        return {
          id: 'customer-existing',
          phone: '08010000000',
        };
      }
      // Email or other checks - return null
      return null;
    });

    await expect(
      service.create(context, {
        name: 'Ada',
        phone: '08010000000',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates a customer with normalized email and writes an audit entry', async () => {
    prisma.customer.findFirst.mockResolvedValue(null);
    prisma.customer.create.mockResolvedValue({
      id: 'customer-1',
      name: 'Ada',
      email: 'ada@example.com',
    });

    const result = await service.create(context, {
      name: 'Ada',
      email: ' Ada@Example.com ',
    });

    expect(prisma.customer.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        name: 'Ada',
        email: 'ada@example.com',
      },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CUSTOMER_CREATED',
        entityId: 'customer-1',
      }),
    );
    expect(result).toEqual({
      id: 'customer-1',
      name: 'Ada',
      email: 'ada@example.com',
    });
  });

  it('updates an existing customer and writes an audit entry', async () => {
    prisma.customer.findFirst
      .mockResolvedValueOnce({
        id: 'customer-1',
        name: 'Ada',
        _count: { sales: 0 },
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prisma.customer.update.mockResolvedValue({
      id: 'customer-1',
      name: 'Ada Lovelace',
    });

    const result = await service.update(context, 'customer-1', {
      name: 'Ada Lovelace',
    });

    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'customer-1' },
      data: {
        name: 'Ada Lovelace',
      },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CUSTOMER_UPDATED',
        entityId: 'customer-1',
      }),
    );
    expect(result).toEqual({
      id: 'customer-1',
      name: 'Ada Lovelace',
    });
  });

  it('rejects customer update when another customer already has the email', async () => {
    prisma.customer.findFirst
      .mockResolvedValueOnce({
        id: 'customer-1',
        name: 'Ada',
        _count: { sales: 0 },
      })
      .mockResolvedValueOnce({
        id: 'customer-2',
        email: 'ada@example.com',
      });

    await expect(
      service.update(context, 'customer-1', {
        email: 'ada@example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
