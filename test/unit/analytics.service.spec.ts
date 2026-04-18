import { Prisma } from '@prisma/client';
import { AnalyticsService } from 'src/modules/analytics/analytics.service';

describe('AnalyticsService', () => {
  let prisma: {
    sale: {
      aggregate: jest.Mock;
      groupBy: jest.Mock;
      findMany: jest.Mock;
    };
    saleItem: {
      groupBy: jest.Mock;
      findMany: jest.Mock;
    };
    product: {
      findMany: jest.Mock;
    };
    customer: {
      findMany: jest.Mock;
    };
  };
  let service: AnalyticsService;

  beforeEach(() => {
    prisma = {
      sale: {
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      saleItem: {
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
      },
      customer: {
        findMany: jest.fn(),
      },
    };

    service = new AnalyticsService(prisma as never);
  });

  it('returns dashboard metrics for a single-day range', async () => {
    prisma.sale.aggregate.mockResolvedValue({
      _sum: { totalAmount: new Prisma.Decimal(150) },
      _count: { id: 3 },
    });
    prisma.saleItem.groupBy.mockResolvedValue([
      { productId: 'product-1', _sum: { quantity: new Prisma.Decimal(4) } },
    ]);
    prisma.sale.groupBy.mockResolvedValue([
      {
        customerId: 'customer-1',
        _sum: { totalAmount: new Prisma.Decimal(90) },
        _count: { id: 2 },
      },
    ]);

    // Create dates ensuring they're in the same day (use local time directly)
    const d1 = new Date();
    d1.setHours(9, 15, 0, 0);
    const d2 = new Date();
    d2.setHours(9, 45, 0, 0);
    const d3 = new Date();
    d3.setHours(15, 10, 0, 0);

    const saleData = [
      {
        completedAt: d1,
        totalAmount: new Prisma.Decimal(50),
      },
      {
        completedAt: d2,
        totalAmount: new Prisma.Decimal(40),
      },
      {
        completedAt: d3,
        totalAmount: new Prisma.Decimal(60),
      },
    ];

    // Mock prisma.sale.findMany to return sale data
    (prisma.sale.findMany as jest.Mock).mockResolvedValue(saleData);
    prisma.saleItem.findMany.mockResolvedValue([
      {
        quantity: new Prisma.Decimal(2),
        lineTotal: new Prisma.Decimal(37),
        product: { cost: new Prisma.Decimal(12) },
      },
      {
        quantity: new Prisma.Decimal(1),
        lineTotal: new Prisma.Decimal(53),
        product: { cost: new Prisma.Decimal(18) },
      },
    ]);
    prisma.product.findMany.mockResolvedValue([{ id: 'product-1', name: 'Bread' }]);
    prisma.customer.findMany.mockResolvedValue([{ id: 'customer-1', name: 'Ada' }]);

    const today = new Date();
    const from = new Date(today);
    from.setHours(0, 0, 0, 0);
    const to = new Date(today);
    to.setHours(23, 59, 59, 999);

    const result = await service.dashboard('tenant-1', {
      from: from.toISOString(),
      to: to.toISOString(),
    });

    expect(result.salesCount).toBe(3);
    expect(result.profitEstimate).toEqual({
      revenue: 150,
      estimatedCost: 42,
      grossProfit: 48,
      grossMargin: 32,
    });
    expect(result.topProducts).toEqual([
      {
        productId: 'product-1',
        name: 'Bread',
        quantitySold: new Prisma.Decimal(4),
      },
    ]);
    expect(result.topCustomers).toEqual([
      {
        customerId: 'customer-1',
        name: 'Ada',
        totalSpent: new Prisma.Decimal(90),
        salesCount: 2,
      },
    ]);

    const hourly09 = result.hourlySales.find((entry) => entry.hour === '09');
    const hourly15 = result.hourlySales.find((entry) => entry.hour === '15');

    expect(hourly09).toBeTruthy();
    if (hourly09) {
      expect(hourly09.salesCount).toBe(2);
      expect(hourly09.revenue).toBe(90);
    }

    expect(hourly15).toBeTruthy();
    if (hourly15) {
      expect(hourly15.salesCount).toBe(1);
      expect(hourly15.revenue).toBe(60);
    }
  });

  it('returns an empty hourly breakdown for multi-day ranges', async () => {
    prisma.sale.aggregate.mockResolvedValue({
      _sum: { totalAmount: new Prisma.Decimal(0) },
      _count: { id: 0 },
    });
    prisma.saleItem.groupBy.mockResolvedValue([]);
    prisma.sale.groupBy.mockResolvedValue([]);
    prisma.sale.findMany.mockResolvedValue([]);
    prisma.saleItem.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.customer.findMany.mockResolvedValue([]);

    const result = await service.dashboard('tenant-1', {
      from: '2026-04-16T00:00:00.000Z',
      to: '2026-04-17T23:59:59.999Z',
    });

    expect(result.hourlySales).toEqual([]);
    expect(result.profitEstimate).toEqual({
      revenue: 0,
      estimatedCost: 0,
      grossProfit: 0,
      grossMargin: 0,
    });
  });
});
