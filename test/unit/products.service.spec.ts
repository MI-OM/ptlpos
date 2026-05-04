import { ProductType } from '@prisma/client';
import { ProductsService } from 'src/modules/products/products.service';

describe('ProductsService', () => {
  let prisma: {
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
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it('queries products with pagination and filters and caches the response', async () => {
    redis.get.mockResolvedValue(null);
    prisma.product.findMany.mockResolvedValue([{ id: 'product-1', name: 'Bread' }]);
    prisma.product.count.mockResolvedValue(1);

    const result = await service.findAll('tenant-1', {
      page: 2,
      limit: 10,
      q: 'bread',
      sku: 'BRD',
      type: ProductType.SIMPLE,
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
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
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(redis.set).toHaveBeenCalled();
    expect(result).toEqual({
      data: [{ id: 'product-1', name: 'Bread' }],
      pagination: {
        page: 2,
        limit: 10,
        total: 1,
        pages: 1,
      },
    });
  });
});
