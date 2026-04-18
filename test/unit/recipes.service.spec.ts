import { ConflictException, NotFoundException } from '@nestjs/common';
import { RecipesService } from 'src/modules/recipes/recipes.service';

describe('RecipesService', () => {
  const context = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    role: 'ADMIN',
  } as const;

  let prisma: {
    product: { findMany: jest.Mock };
    recipe: { findMany: jest.Mock; findFirst: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    recipeItem: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { log: jest.Mock };
  let service: RecipesService;

  beforeEach(() => {
    prisma = {
      product: { findMany: jest.fn() },
      recipe: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      recipeItem: { deleteMany: jest.fn() },
      $transaction: jest.fn(),
    };
    audit = { log: jest.fn() };
    service = new RecipesService(prisma as never, audit as never);
  });

  it('rejects recipe creation when referenced products are missing', async () => {
    prisma.product.findMany.mockResolvedValue([]);

    await expect(
      service.create(context, {
        productId: 'product-1',
        items: [{ rawMaterialId: 'raw-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects duplicate recipes for the same product', async () => {
    prisma.product.findMany.mockResolvedValue([{ id: 'product-1' }, { id: 'raw-1' }]);
    prisma.recipe.findUnique.mockResolvedValue({ id: 'recipe-1', productId: 'product-1' });

    await expect(
      service.create(context, {
        productId: 'product-1',
        items: [{ rawMaterialId: 'raw-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates a recipe and audits the action', async () => {
    prisma.product.findMany.mockResolvedValue([{ id: 'product-1' }, { id: 'raw-1' }]);
    prisma.recipe.findUnique.mockResolvedValue(null);
    prisma.recipe.create.mockResolvedValue({ id: 'recipe-1' });

    const result = await service.create(context, {
      productId: 'product-1',
      items: [{ rawMaterialId: 'raw-1', quantity: 1.5 }],
    });

    expect(prisma.recipe.create).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalled();
    expect(result).toEqual({ id: 'recipe-1' });
  });
});
