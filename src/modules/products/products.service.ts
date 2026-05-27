import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryTransactionType, ProductType, Prisma, Product } from '@prisma/client';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { CreateProductDto } from './dto/create-product.dto';
import { CompositeProductDto } from './dto/composite-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadProductImageResponseDto } from './dto/upload-product-image-response.dto';
import { RedisService } from '../../core/database/redis.service';
import { AuditService } from '../audit/audit.service';
import { SupabaseStorageService } from './services/supabase-storage.service';
import { SupabaseStorageConfigDto } from './dto/supabase-storage-config.dto';

@Injectable()
export class ProductsService {
  private readonly supabaseStorage: SupabaseStorageService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService
  ) {
    // Initialize Supabase Storage with configuration
    const supabaseConfig: SupabaseStorageConfigDto = {
      url: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
      serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
      bucket: 'product-images',
      public: true,
      allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
      maxSize: 5242880, // 5MB
    };
    this.supabaseStorage = new SupabaseStorageService(supabaseConfig);
  }

  async findAll(tenantId: string, query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const normalizedQuery = query.q?.trim();
    const normalizedSku = query.sku?.trim();
    const normalizedBarcode = query.barcode?.trim();
    const cacheKey = [
      `tenant:${tenantId}:products`,
      `page:${page}`,
      `limit:${limit}`,
      `q:${normalizedQuery ?? ''}`,
      `sku:${normalizedSku ?? ''}`,
      `barcode:${normalizedBarcode ?? ''}`,
      `type:${query.type ?? ''}`,
      `categoryId:${query.categoryId ?? ''}`,
    ].join(':');
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {
      tenantId,
      type: query.type,
      categoryId: query.categoryId,
      sku: normalizedSku
        ? {
            contains: normalizedSku,
            mode: 'insensitive',
          }
        : undefined,
      barcode: normalizedBarcode
        ? {
            equals: normalizedBarcode,
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

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          tenantId: true,
          name: true,
          sku: true,
          imageUrl: true,
          type: true,
          price: true,
          cost: true,
          taxRate: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          // Only include variants and inventory when needed
          ...(query.includeVariants && {
            variants: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
              },
            },
          }),
          ...(query.includeInventory && {
            inventoryRows: {
              select: {
                id: true,
                quantity: true,
                branchId: true,
              },
            },
          }),
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = {
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        variants: true,
        inventoryRows: true,
        category: true,
        compositeParent: {
          include: { child: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(context: AuthContext, dto: CreateProductDto) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        tenantId: context.tenantId,
        sku: dto.sku,
      },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this SKU already exists');
    }

    const product = await this.prisma.$transaction(async tx => {
      const createdProduct = await tx.product.create({
        data: {
          tenantId: context.tenantId,
          categoryId: dto.categoryId,
          name: dto.name,
          sku: dto.sku,
          barcode: dto.barcode,
          imageUrl: dto.imageUrl,
          type: dto.type,
          price: dto.price,
          cost: dto.cost ?? 0,
          taxRate: dto.taxRate ?? 0,
        },
      });

      if (dto.variants && dto.variants.length > 0) {
        for (const variant of dto.variants) {
          const createdVariant = await tx.productVariant.create({
            data: {
              productId: createdProduct.id,
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
            },
          });
          
          // Create inventory row for each variant
          await tx.inventory.create({
            data: {
              tenantId: context.tenantId,
              productId: createdProduct.id,
              productVariantId: createdVariant.id,
              quantity: variant.openingQuantity ?? 0,
            },
          });
          
          if ((variant.openingQuantity ?? 0) > 0) {
            await tx.inventoryTransaction.create({
              data: {
                tenantId: context.tenantId,
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
        // Create inventory row for simple product
        await tx.inventory.create({
          data: {
            tenantId: context.tenantId,
            productId: createdProduct.id,
            quantity: dto.openingQuantity ?? 0,
          },
        });
        
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
      }

      return createdProduct;
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
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        sku: dto.sku,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        price: dto.price,
        cost: dto.cost,
        taxRate: dto.taxRate,
      },
    });

    await this.redis.del(`tenant:${context.tenantId}:products:page:1:limit:20`);
    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: updatedProduct.id,
      metadata: {
        changes: dto,
      },
    });

    return updatedProduct;
  }

  async uploadProductImage(
    user: AuthContext,
    productId: string,
    file: MulterFile,
    metadata?: {
      alt?: string;
      caption?: string;
      tags?: string[];
    },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const uploadResult = await this.supabaseStorage.uploadProductImage(
        productId,
        file,
        {
          alt: metadata?.alt || '',
          caption: metadata?.caption || '',
          tags: metadata?.tags || [],
        },
      );

      await this.prisma.product.update({
        where: {
          id: productId,
          tenantId: user.tenantId,
        },
        data: {
          imageUrl: uploadResult.imageUrl,
          updatedAt: new Date(),
        },
      });

      await this.audit.log({
        tenantId: user.tenantId,
        userId: user.userId,
        action: 'UPDATE',
        entity: 'PRODUCT',
        entityId: productId,
        metadata: {
          action: 'Product image uploaded to Supabase',
          filename: file.originalname,
          size: file.size,
          imageUrl: uploadResult.imageUrl,
        },
      });

      return uploadResult;
    } catch (error) {
      throw new BadRequestException(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadMultipleProductImages(
    user: AuthContext,
    productId: string,
    files: MulterFile[],
    metadata?: {
      alt?: string;
      caption?: string;
      tags?: string[];
    },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    try {
      const uploadResults = await this.supabaseStorage.uploadMultipleProductImages(
        productId,
        files,
        {
          alt: metadata?.alt || '',
          caption: metadata?.caption || '',
          tags: metadata?.tags || [],
        },
      );

      await this.audit.log({
        tenantId: user.tenantId,
        userId: user.userId,
        action: 'UPDATE',
        entity: 'PRODUCT',
        entityId: productId,
        metadata: {
          action: 'Multiple product images uploaded to Supabase',
          fileCount: files.length,
          filenames: files.map(f => f.originalname),
        },
      });

      return uploadResults;
    } catch (error) {
      throw new BadRequestException(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteProductImage(
    user: AuthContext,
    productId: string,
    imageId: string,
  ) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: user.tenantId,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    try {
      await this.supabaseStorage.deleteProductImage(imageId);

      await this.prisma.product.update({
        where: {
          id: productId,
          tenantId: user.tenantId,
        },
        data: {
          imageUrl: null,
          updatedAt: new Date(),
        },
      });

      await this.audit.log({
        tenantId: user.tenantId,
        userId: user.userId,
        action: 'UPDATE',
        entity: 'PRODUCT',
        entityId: productId,
        metadata: {
          action: 'Product image deleted from Supabase',
          imageId: imageId,
        },
      });

      return { success: true };
    } catch (error) {
      throw new BadRequestException(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async remove(context: AuthContext, id: string) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

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

    // Check for existing SKU
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        tenantId: context.tenantId,
        sku: dto.sku,
      },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this SKU already exists');
    }

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

      for (const component of dto.components) {
        await tx.compositeProductItem.create({
          data: {
            parentId: createdProduct.id,
            childProductId: component.productId,
            quantity: component.quantity,
          },
        });
      }

      await tx.inventory.create({
        data: {
          tenantId: context.tenantId,
          productId: createdProduct.id,
          quantity: dto.openingQuantity ?? 0,
        },
      });

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

  async getProductHistory(
    tenantId: string,
    productId: string,
    page = 1,
    limit = 20,
    type?: string
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const skip = (page - 1) * limit;
    
    const where: Prisma.InventoryTransactionWhereInput = {
      tenantId,
      productId,
    };

    if (type) {
      where.type = type as InventoryTransactionType;
    }

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.inventoryTransaction.findMany({
        where,
        include: {
          product: true,
          productVariant: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.inventoryTransaction.count({
        where,
      }),
    ]);

    return {
      data: transactions,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getCompositeWithInventory(tenantId: string, productId: string) {
    const product = await this.getComposite(tenantId, productId);

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
      product,
      components,
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
      include: { compositeParent: true },
    });

    if (!composite) {
      throw new NotFoundException('Composite product not found');
    }

    for (const item of composite.compositeParent) {
      const componentInventory = await tx.inventory.findFirst({
        where: {
          tenantId,
          productId: item.childProductId,
          productVariantId: null,
        },
      });

      if (!componentInventory) {
        throw new BadRequestException(`Component inventory not found for product: ${item.childProductId}`);
      }

      const requiredQuantity = item.quantity * quantity;
      if (componentInventory.quantity < requiredQuantity) {
        throw new BadRequestException(`Insufficient inventory for component: ${item.childProductId}`);
      }

      await tx.inventory.update({
        where: { id: componentInventory.id },
        data: {
          quantity: componentInventory.quantity - requiredQuantity,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          productId: item.childProductId,
          type: InventoryTransactionType.SALE,
          quantity: -requiredQuantity,
          balanceAfter: componentInventory.quantity - requiredQuantity,
          referenceType: 'sale',
          referenceId: compositeProductId,
        },
      });
    }
  }
}
