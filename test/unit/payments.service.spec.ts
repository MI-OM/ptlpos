import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  PaymentDirection,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  SaleStatus,
} from '@prisma/client';
import { PaymentsService } from 'src/modules/payments/payments.service';

describe('PaymentsService', () => {
  const context = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    role: 'ADMIN',
  } as const;

  let prisma: {
    $transaction: jest.Mock;
    payment: {
      groupBy: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let audit: {
    log: jest.Mock;
  };
  let service: PaymentsService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      payment: {
        groupBy: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    audit = {
      log: jest.fn(),
    };

    service = new PaymentsService(prisma as never, audit as never);
  });

  it('throws when the sale does not exist', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        sale: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      }),
    );

    await expect(
      service.create(context, {
        saleId: 'sale-1',
        method: PaymentMethod.CASH,
        amount: 50,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects payments against cancelled or refunded sales', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        sale: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'sale-1',
            status: SaleStatus.CANCELLED,
            paidAmount: new Prisma.Decimal(0),
            totalAmount: new Prisma.Decimal(50),
          }),
        },
      }),
    );

    await expect(
      service.create(context, {
        saleId: 'sale-1',
        method: PaymentMethod.CASH,
        amount: 50,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects payments above the sale total', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        sale: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'sale-1',
            status: SaleStatus.OPEN,
            paidAmount: new Prisma.Decimal(40),
            totalAmount: new Prisma.Decimal(50),
          }),
        },
      }),
    );

    await expect(
      service.create(context, {
        saleId: 'sale-1',
        method: PaymentMethod.CARD,
        amount: 15,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records the payment and updates the paid amount', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    const paymentCreate = jest.fn().mockResolvedValue({ id: 'payment-1' });
    const saleUpdate = jest.fn().mockResolvedValue({ id: 'sale-1' });

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        sale: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'sale-1',
            status: SaleStatus.OPEN,
            paidAmount: new Prisma.Decimal(10),
            totalAmount: new Prisma.Decimal(50),
          }),
          update: saleUpdate,
        },
        payment: {
          create: paymentCreate,
        },
      }),
    );

    const result = await service.create(context, {
      saleId: 'sale-1',
      method: PaymentMethod.TRANSFER,
      amount: 20,
      reference: 'bank-ref',
      externalRef: 'trf-001',
    });

    expect(paymentCreate).toHaveBeenCalled();
    expect(saleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paidAmount: expect.any(Prisma.Decimal),
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalled();
    expect(result).toEqual({ id: 'payment-1' });
  });

  it('rejects card payments without an external reference', async () => {
    await expect(
      service.create(context, {
        saleId: 'sale-1',
        method: PaymentMethod.CARD,
        amount: 20,
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not increase paid amount for pending payments', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    const paymentCreate = jest.fn().mockResolvedValue({ id: 'payment-1', status: PaymentStatus.PENDING });
    const saleUpdate = jest.fn();

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        sale: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'sale-1',
            status: SaleStatus.OPEN,
            paidAmount: new Prisma.Decimal(10),
            totalAmount: new Prisma.Decimal(50),
          }),
          update: saleUpdate,
        },
        payment: {
          create: paymentCreate,
        },
      }),
    );

    const result = await service.create(context, {
      saleId: 'sale-1',
      method: PaymentMethod.TRANSFER,
      amount: 20,
      externalRef: 'trf-123',
      status: PaymentStatus.PENDING,
    });

    expect(saleUpdate).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'payment-1', status: PaymentStatus.PENDING });
  });

  it('updates sale paid amount when a sale payment moves to completed', async () => {
    const saleUpdate = jest.fn().mockResolvedValue({ id: 'sale-1' });
    const paymentUpdate = jest.fn().mockResolvedValue({
      id: 'payment-1',
      status: PaymentStatus.COMPLETED,
    });

    prisma.payment.findFirst
      .mockResolvedValueOnce({
        id: 'payment-1',
        tenantId: 'tenant-1',
        saleId: 'sale-1',
        amount: new Prisma.Decimal(20),
        status: PaymentStatus.PENDING,
        direction: PaymentDirection.SALE,
      })
      .mockResolvedValueOnce({
        id: 'payment-1',
        tenantId: 'tenant-1',
        saleId: 'sale-1',
        amount: new Prisma.Decimal(20),
        status: PaymentStatus.PENDING,
        direction: PaymentDirection.SALE,
      });

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        payment: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'payment-1',
            tenantId: 'tenant-1',
            saleId: 'sale-1',
            amount: new Prisma.Decimal(20),
            status: PaymentStatus.PENDING,
            direction: PaymentDirection.SALE,
          }),
          update: paymentUpdate,
        },
        sale: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'sale-1',
            tenantId: 'tenant-1',
            paidAmount: new Prisma.Decimal(10),
            totalAmount: new Prisma.Decimal(50),
          }),
          update: saleUpdate,
        },
      }),
    );

    const result = await service.updateStatus(context, 'payment-1', PaymentStatus.COMPLETED);

    expect(saleUpdate).toHaveBeenCalledWith({
      where: { id: 'sale-1' },
      data: {
        paidAmount: new Prisma.Decimal(30),
      },
    });
    expect(result).toEqual({
      id: 'payment-1',
      status: PaymentStatus.COMPLETED,
    });
  });

  it('updates sale paid amount when a completed sale payment is reversed away from completed', async () => {
    const saleUpdate = jest.fn().mockResolvedValue({ id: 'sale-1' });
    const paymentUpdate = jest.fn().mockResolvedValue({
      id: 'payment-1',
      status: PaymentStatus.FAILED,
    });

    prisma.payment.findFirst
      .mockResolvedValueOnce({
        id: 'payment-1',
        tenantId: 'tenant-1',
        saleId: 'sale-1',
        amount: new Prisma.Decimal(20),
        status: PaymentStatus.COMPLETED,
        direction: PaymentDirection.SALE,
      })
      .mockResolvedValueOnce({
        id: 'payment-1',
        tenantId: 'tenant-1',
        saleId: 'sale-1',
        amount: new Prisma.Decimal(20),
        status: PaymentStatus.COMPLETED,
        direction: PaymentDirection.SALE,
      });

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        payment: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'payment-1',
            tenantId: 'tenant-1',
            saleId: 'sale-1',
            amount: new Prisma.Decimal(20),
            status: PaymentStatus.COMPLETED,
            direction: PaymentDirection.SALE,
          }),
          update: paymentUpdate,
        },
        sale: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'sale-1',
            tenantId: 'tenant-1',
            paidAmount: new Prisma.Decimal(30),
            totalAmount: new Prisma.Decimal(50),
          }),
          update: saleUpdate,
        },
      }),
    );

    const result = await service.updateStatus(context, 'payment-1', PaymentStatus.FAILED);

    expect(saleUpdate).toHaveBeenCalledWith({
      where: { id: 'sale-1' },
      data: {
        paidAmount: new Prisma.Decimal(10),
      },
    });
    expect(result).toEqual({
      id: 'payment-1',
      status: PaymentStatus.FAILED,
    });
  });

  it('returns reconciliation totals grouped by payment method', async () => {
    prisma.payment.groupBy.mockResolvedValue([
      {
        method: PaymentMethod.CASH,
        direction: PaymentDirection.SALE,
        _sum: { amount: new Prisma.Decimal(100) },
        _count: { _all: 2 },
      },
      {
        method: PaymentMethod.CASH,
        direction: PaymentDirection.REFUND,
        _sum: { amount: new Prisma.Decimal(20) },
        _count: { _all: 1 },
      },
      {
        method: PaymentMethod.CARD,
        direction: PaymentDirection.SALE,
        _sum: { amount: new Prisma.Decimal(50) },
        _count: { _all: 1 },
      },
    ]);

    const result = await service.reconciliation('tenant-1', {
      from: '2026-04-01T00:00:00.000Z',
      to: '2026-04-30T23:59:59.999Z',
    });

    expect(prisma.payment.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['method', 'direction'],
        where: expect.objectContaining({
          tenantId: 'tenant-1',
        }),
      }),
    );
    expect(result).toEqual({
      range: {
        from: '2026-04-01T00:00:00.000Z',
        to: '2026-04-30T23:59:59.999Z',
      },
      totals: {
        salesAmount: 150,
        refundAmount: 20,
        netAmount: 130,
        salesCount: 3,
        refundCount: 1,
      },
      methods: [
        {
          method: PaymentMethod.CASH,
          salesAmount: 100,
          refundAmount: 20,
          netAmount: 80,
          salesCount: 2,
          refundCount: 1,
        },
        {
          method: PaymentMethod.TRANSFER,
          salesAmount: 0,
          refundAmount: 0,
          netAmount: 0,
          salesCount: 0,
          refundCount: 0,
        },
        {
          method: PaymentMethod.CARD,
          salesAmount: 50,
          refundAmount: 0,
          netAmount: 50,
          salesCount: 1,
          refundCount: 0,
        },
        {
          method: PaymentMethod.STORE_CREDIT,
          salesAmount: 0,
          refundAmount: 0,
          netAmount: 0,
          salesCount: 0,
          refundCount: 0,
        },
      ],
    });
  });

  it('returns a cash drawer summary scoped to completed cash payments', async () => {
    prisma.payment.groupBy.mockResolvedValue([
      {
        direction: PaymentDirection.SALE,
        _sum: { amount: new Prisma.Decimal(125) },
        _count: { _all: 3 },
      },
      {
        direction: PaymentDirection.REFUND,
        _sum: { amount: new Prisma.Decimal(20) },
        _count: { _all: 1 },
      },
    ]);

    const result = await service.cashDrawerSummary('tenant-1', {
      from: '2026-04-18T00:00:00.000Z',
      to: '2026-04-18T23:59:59.999Z',
      countedCash: 100,
      branchId: 'branch-1',
    });

    expect(prisma.payment.groupBy).toHaveBeenCalledWith({
      by: ['direction'],
      where: {
        tenantId: 'tenant-1',
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        createdAt: {
          gte: new Date('2026-04-18T00:00:00.000Z'),
          lte: new Date('2026-04-18T23:59:59.999Z'),
        },
        sale: {
          branchId: 'branch-1',
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });
    expect(result).toEqual({
      range: {
        from: '2026-04-18T00:00:00.000Z',
        to: '2026-04-18T23:59:59.999Z',
      },
      branchId: 'branch-1',
      currency: 'NGN',
      expectedCash: 105,
      countedCash: 100,
      variance: -5,
      totals: {
        salesCash: 125,
        refundCash: 20,
        netCash: 105,
        salesCount: 3,
        refundCount: 1,
      },
    });
  });

  it('returns a null variance when counted cash is not supplied', async () => {
    prisma.payment.groupBy.mockResolvedValue([
      {
        direction: PaymentDirection.SALE,
        _sum: { amount: new Prisma.Decimal(50) },
        _count: { _all: 1 },
      },
    ]);

    const result = await service.cashDrawerSummary('tenant-1', {});

    expect(result).toEqual({
      range: {
        from: null,
        to: null,
      },
      branchId: null,
      currency: 'NGN',
      expectedCash: 50,
      countedCash: null,
      variance: null,
      totals: {
        salesCash: 50,
        refundCash: 0,
        netCash: 50,
        salesCount: 1,
        refundCount: 0,
      },
    });
  });
});
