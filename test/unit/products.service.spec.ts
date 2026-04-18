import { ProductType } from '@prisma/client';
import { ProductsService } from 'src/modules/products/products.service';

describe('ProductsService', () => {
  let prisma: {
    $transaction: jest.Mock;
    product: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };
  let redis: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };
  let audit: {
    log: jest.Mock;
  };
  let service: ProductsService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    audit = {
      log: jest.fn(),
    };

    service = new ProductsService(prisma as never, redis as never, audit as never);
  });

  it('returns cached product query results when available', async () => {
    redis.get.mockResolvedValue(
      JSON.stringify({
        data: [{ id: 'product-1' }],
        meta: { page: 1, limit: 20, total: 1 },
      }),
    );

    const result = await service.findAll('tenant-1', {
      page: 1,
      limit: 20,
      q: 'bread',
      sku: 'BRD',
      type: ProductType.SIMPLE,
    });

    expect(result).toEqual({
      data: [{ id: 'product-1' }],
      meta: { page: 1, limit: 20, total: 1 },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('queries products with pagination and filters and caches the response', async () => {
    redis.get.mockResolvedValue(null);
    prisma.product.findMany.mockReturnValue({
      args: {
        where: {
          tenantId: 'tenant-1',
          type: ProductType.SIMPLE,
          sku: {
            contains: 'BRD',
            mode: 'insensitive',
          },
        },
        skip: 10,
        take: 10,
      },
    });
    prisma.product.count.mockReturnValue({
      args: {
        where: {
          tenantId: 'tenant-1',
        },
      },
    });
    prisma.$transaction.mockResolvedValue([
      [{ id: 'product-1', name: 'Bread', variants: [] }],
      1,
    ]);

    const result = await service.findAll('tenant-1', {
      page: 2,
      limit: 10,
      q: 'bread',
      sku: 'BRD',
      type: ProductType.SIMPLE,
    });

    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        args: expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            type: ProductType.SIMPLE,
            sku: {
              contains: 'BRD',
              mode: 'insensitive',
            },
          }),
          skip: 10,
          take: 10,
        }),
      }),
      expect.objectContaining({
        args: expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
          }),
        }),
      }),
    ]);
    expect(redis.set).toHaveBeenCalled();
    expect(result).toEqual({
      data: [{ id: 'product-1', name: 'Bread', variants: [] }],
      meta: {
        page: 2,
        limit: 10,
        total: 1,
      },
    });
  });
});
