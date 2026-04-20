import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryTransactionType, ProductType, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { RedisService } from '../../core/database/redis.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CompositeProductDto } from './dto/composite-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService
  ) {}

  async findAll(tenantId: string, query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const normalizedQuery = query.q?.trim();
    const normalizedSku = query.sku?.trim();
    const cacheKey = [
      `tenant:${tenantId}:products`,
      `page:${page}`,
      `limit:${limit}`,
      `q:${normalizedQuery ?? ''}`,
      `sku:${normalizedSku ?? ''}`,
      `type:${query.type ?? ''}`,
    ].join(':');
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {
      tenantId,
      type: query.type,
      sku: normalizedSku
        ? {
            contains: normalizedSku,
            mode: 'insensitive',
          }
        : undefined,
      OR: normalizedQuery
        ? [
            {
              name: {
                contains: normalizedQuery,
                mode: 'insensitive',
              },
            },
            {
              sku: {
                contains: normalizedQuery,
                mode: 'insensitive',
              },
            },
            {
              variants: {
                some: {
                  OR: [
                    {
                      name: {
                        contains: normalizedQuery,
                        mode: 'insensitive',
                      },
                    },
                    {
                      sku: {
                        contains: normalizedQuery,
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              },
            },
          ]
        : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { variants: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const response = {
      data: items,
      meta: {
        page,
        limit,
        total,
      },
    };

    await this.redis.set(cacheKey, JSON.stringify(response), 60);
    return response;
  }

  async findOneOrThrow(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { variants: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(context: AuthContext, dto: CreateProductDto) {
    if (dto.type === ProductType.VARIANT && (!dto.variants || dto.variants.length === 0)) {
      throw new BadRequestException('Variant products require at least one variant');
    }

    if (dto.type !== ProductType.VARIANT && dto.variants?.length) {
      throw new BadRequestException('Only variant products can include variants');
    }

    const product = await this.prisma.$transaction(async tx => {
      const createdProduct = await tx.product.create({
        data: {
          tenantId: context.tenantId,
          name: dto.name,
          sku: dto.sku,
          imageUrl: dto.imageUrl,
          type: dto.type,
          price: dto.price,
          cost: dto.cost,
          taxRate: dto.taxRate ?? 0,
        },
      });

      if (dto.type === ProductType.VARIANT && dto.variants) {
        for (const variant of dto.variants) {
          const createdVariant = await tx.productVariant.create({
            data: {
              productId: createdProduct.id,
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
            },
          });

          await tx.inventory.create({
            data: {
              tenantId: context.tenantId,
              branchId: context.branchId,
              productId: createdProduct.id,
              productVariantId: createdVariant.id,
              quantity: variant.openingQuantity ?? 0,
            },
          });

          if ((variant.openingQuantity ?? 0) > 0) {
            await tx.inventoryTransaction.create({
              data: {
                tenantId: context.tenantId,
                branchId: context.branchId,
                productId: createdProduct.id,
                productVariantId: createdVariant.id,
                type: InventoryTransactionType.OPENING,
                quantity: variant.openingQuantity ?? 0,
                balanceAfter: variant.openingQuantity ?? 0,
                referenceType: 'product',
                referenceId: createdProduct.id,
              },
            });
          }
        }
      } else {
        await tx.inventory.create({
          data: {
            tenantId: context.tenantId,
            branchId: context.branchId,
            productId: createdProduct.id,
            quantity: dto.openingQuantity ?? 0,
          },
        });

        if ((dto.openingQuantity ?? 0) > 0) {
          await tx.inventoryTransaction.create({
            data: {
              tenantId: context.tenantId,
              branchId: context.branchId,
              productId: createdProduct.id,
              type: InventoryTransactionType.OPENING,
              quantity: dto.openingQuantity ?? 0,
              balanceAfter: dto.openingQuantity ?? 0,
              referenceType: 'product',
              referenceId: createdProduct.id,
            },
          });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id: createdProduct.id },
        include: { variants: true },
      });
    });

    await this.redis.del(`tenant:${context.tenantId}:products:page:1:limit:20`);
    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product.id,
      metadata: {
        type: dto.type,
      },
    });

    return product;
  }

  async update(context: AuthContext, id: string, dto: UpdateProductDto) {
    await this.findOneOrThrow(context.tenantId, id);

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        sku: dto.sku,
        imageUrl: dto.imageUrl,
        price: dto.price,
        cost: dto.cost,
        taxRate: dto.taxRate,
      },
      include: { variants: true },
    });

    await this.redis.del(`tenant:${context.tenantId}:products:page:1:limit:20`);
    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: id,
      metadata: dto as Prisma.JsonObject,
    });

    return product;
  }

  async remove(context: AuthContext, id: string) {
    await this.findOneOrThrow(context.tenantId, id);

    await this.prisma.product.delete({
      where: { id },
    });

    await this.redis.del(`tenant:${context.tenantId}:products:page:1:limit:20`);
    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'PRODUCT_DELETED',
      entity: 'Product',
      entityId: id,
    });

    return { success: true };
  }

  async createComposite(context: AuthContext, dto: CompositeProductDto) {
    if (!dto.components || dto.components.length === 0) {
      throw new BadRequestException('Composite products require at least one component');
    }

    // Verify all component products exist and belong to the tenant
    const componentIds = dto.components.map(c => c.productId);
    const components = await this.prisma.product.findMany({
      where: {
        id: { in: componentIds },
        tenantId: context.tenantId,
      },
    });

    if (components.length !== componentIds.length) {
      throw new BadRequestException('One or more component products not found');
    }

    const product = await this.prisma.$transaction(async tx => {
      const createdProduct = await tx.product.create({
        data: {
          tenantId: context.tenantId,
          name: dto.name,
          sku: dto.sku,
          imageUrl: dto.imageUrl,
          type: ProductType.COMPOSITE,
          price: dto.price,
          cost: dto.cost ?? 0,
          taxRate: dto.taxRate ?? 0,
        },
      });

      // Add composite components
      for (const component of dto.components) {
        await tx.compositeProductItem.create({
          data: {
            parentId: createdProduct.id,
            childProductId: component.productId,
            quantity: component.quantity,
          },
        });
      }

      // Create inventory row
      await tx.inventory.create({
        data: {
          tenantId: context.tenantId,
          productId: createdProduct.id,
          quantity: dto.openingQuantity ?? 0,
        },
      });

      // Create opening inventory transaction
      if ((dto.openingQuantity ?? 0) > 0) {
        await tx.inventoryTransaction.create({
          data: {
            tenantId: context.tenantId,
            productId: createdProduct.id,
            type: InventoryTransactionType.OPENING,
            quantity: dto.openingQuantity ?? 0,
            balanceAfter: dto.openingQuantity ?? 0,
            referenceType: 'product',
            referenceId: createdProduct.id,
          },
        });
      }

      return tx.product.findUniqueOrThrow({
        where: { id: createdProduct.id },
        include: {
          compositeParent: {
            include: { child: true },
          },
        },
      });
    });

    await this.redis.del(`tenant:${context.tenantId}:products:page:1:limit:20`);
    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'COMPOSITE_PRODUCT_CREATED',
      entity: 'Product',
      entityId: product.id,
      metadata: {
        type: ProductType.COMPOSITE,
        componentCount: dto.components.length,
      },
    });

    return product;
  }

  async getComposite(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        type: ProductType.COMPOSITE,
      },
      include: {
        compositeParent: {
          include: {
            child: {
              include: {
                variants: true,
              },
            },
          },
        },
        inventoryRows: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Composite product not found');
    }

    return product;
  }

  async getCompositeWithInventory(tenantId: string, productId: string) {
    const product = await this.getComposite(tenantId, productId);

    // Get inventory levels for all components
    const components = await Promise.all(
      product.compositeParent.map(async item => {
        const componentInventory = await this.prisma.inventory.findFirst({
          where: {
            tenantId,
            productId: item.childProductId,
            productVariantId: null,
          },
        });

        return {
          component: item.child,
          quantity: item.quantity,
          availableStock: componentInventory?.quantity || 0,
          canFulfill: (componentInventory?.quantity || 0) >= item.quantity,
        };
      })
    );

    return {
      ...product,
      compositeParent: components,
      allComponentsAvailable: components.every(c => c.canFulfill),
    };
  }

  async deductCompositeComponents(
    tx: any,
    tenantId: string,
    compositeProductId: string,
    quantity: number
  ) {
    const composite = await tx.product.findUnique({
      where: { id: compositeProductId },
      include: {
        compositeParent: true,
      },
    });

    if (!composite) {
      throw new NotFoundException('Composite product not found');
    }

    if (composite.type !== ProductType.COMPOSITE) {
      throw new BadRequestException('Product is not a composite product');
    }

    // Deduct each component from inventory
    for (const component of composite.compositeParent) {
      const inventory = await tx.inventory.findFirst({
        where: {
          tenantId,
          productId: component.childProductId,
          productVariantId: null,
        },
      });

      if (!inventory) {
        throw new NotFoundException(
          `Inventory not found for component product ${component.childProductId}`
        );
      }

      // Calculate total quantity to deduct (component quantity * sale quantity)
      const totalToDeduct = new Prisma.Decimal(component.quantity).mul(quantity);
      const nextQuantity = new Prisma.Decimal(inventory.quantity).sub(totalToDeduct);

      if (nextQuantity.lessThan(0)) {
        throw new ConflictException(
          `Insufficient stock for component product. Need ${totalToDeduct}, have ${inventory.quantity}`
        );
      }

      // Update component inventory
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: nextQuantity },
      });

      // Record transaction for each component
      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          productId: component.childProductId,
          type: InventoryTransactionType.SALE,
          quantity: totalToDeduct.mul(-1),
          balanceAfter: nextQuantity,
          referenceType: 'composite_sale',
          referenceId: compositeProductId,
          note: `Deducted for composite product sale (${quantity}x)`,
        },
      });
    }
  }
}
