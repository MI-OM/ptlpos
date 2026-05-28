"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../core/database/prisma.service");
const redis_service_1 = require("../../core/database/redis.service");
const audit_service_1 = require("../audit/audit.service");
const supabase_storage_service_1 = require("./services/supabase-storage.service");
let ProductsService = class ProductsService {
    prisma;
    redis;
    audit;
    supabaseStorage;
    constructor(prisma, redis, audit) {
        this.prisma = prisma;
        this.redis = redis;
        this.audit = audit;
        const supabaseConfig = {
            url: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
            serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
            bucket: 'product-images',
            public: true,
            allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
            maxSize: 5242880,
        };
        this.supabaseStorage = new supabase_storage_service_1.SupabaseStorageService(supabaseConfig);
    }
    async findAll(tenantId, query) {
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
        const where = {
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
    async findOne(tenantId, id) {
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
            throw new common_1.NotFoundException('Product not found');
        }
        return product;
    }
    async create(context, dto) {
        const existingProduct = await this.prisma.product.findFirst({
            where: {
                tenantId: context.tenantId,
                sku: dto.sku,
            },
        });
        if (existingProduct) {
            throw new common_1.ConflictException('Product with this SKU already exists');
        }
        const product = await this.prisma.$transaction(async (tx) => {
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
                                type: client_1.InventoryTransactionType.OPENING,
                                quantity: variant.openingQuantity ?? 0,
                                balanceAfter: variant.openingQuantity ?? 0,
                                referenceType: 'product',
                                referenceId: createdProduct.id,
                            },
                        });
                    }
                }
            }
            else {
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
                            type: client_1.InventoryTransactionType.OPENING,
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
    async update(context, id, dto) {
        const existingProduct = await this.prisma.product.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
            },
        });
        if (!existingProduct) {
            throw new common_1.NotFoundException('Product not found');
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
    async uploadProductImage(user, productId, file, metadata) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        try {
            const uploadResult = await this.supabaseStorage.uploadProductImage(productId, file, {
                alt: metadata?.alt || '',
                caption: metadata?.caption || '',
                tags: metadata?.tags || [],
            });
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
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async uploadMultipleProductImages(user, productId, files, metadata) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No files provided');
        }
        try {
            const uploadResults = await this.supabaseStorage.uploadMultipleProductImages(productId, files, {
                alt: metadata?.alt || '',
                caption: metadata?.caption || '',
                tags: metadata?.tags || [],
            });
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
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteProductImage(user, productId, imageId) {
        const existingProduct = await this.prisma.product.findFirst({
            where: {
                id: productId,
                tenantId: user.tenantId,
            },
        });
        if (!existingProduct) {
            throw new common_1.NotFoundException('Product not found');
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
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async remove(context, id) {
        const existingProduct = await this.prisma.product.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
            },
        });
        if (!existingProduct) {
            throw new common_1.NotFoundException('Product not found');
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
    async createComposite(context, dto) {
        if (!dto.components || dto.components.length === 0) {
            throw new common_1.BadRequestException('Composite products require at least one component');
        }
        const existingProduct = await this.prisma.product.findFirst({
            where: {
                tenantId: context.tenantId,
                sku: dto.sku,
            },
        });
        if (existingProduct) {
            throw new common_1.ConflictException('Product with this SKU already exists');
        }
        const componentIds = dto.components.map(c => c.productId);
        const components = await this.prisma.product.findMany({
            where: {
                id: { in: componentIds },
                tenantId: context.tenantId,
            },
        });
        if (components.length !== componentIds.length) {
            throw new common_1.BadRequestException('One or more component products not found');
        }
        const product = await this.prisma.$transaction(async (tx) => {
            const createdProduct = await tx.product.create({
                data: {
                    tenantId: context.tenantId,
                    name: dto.name,
                    sku: dto.sku,
                    imageUrl: dto.imageUrl,
                    type: client_1.ProductType.COMPOSITE,
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
                        type: client_1.InventoryTransactionType.OPENING,
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
                type: client_1.ProductType.COMPOSITE,
                componentCount: dto.components.length,
            },
        });
        return product;
    }
    async getComposite(tenantId, productId) {
        const product = await this.prisma.product.findFirst({
            where: {
                id: productId,
                tenantId,
                type: client_1.ProductType.COMPOSITE,
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
            throw new common_1.NotFoundException('Composite product not found');
        }
        return product;
    }
    async getProductHistory(tenantId, productId, page = 1, limit = 20, type) {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, tenantId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            productId,
        };
        if (type) {
            where.type = type;
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
    async getCompositeWithInventory(tenantId, productId) {
        const product = await this.getComposite(tenantId, productId);
        const components = await Promise.all(product.compositeParent.map(async (item) => {
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
        }));
        return {
            product,
            components,
        };
    }
    async deductCompositeComponents(tx, tenantId, compositeProductId, quantity) {
        const composite = await tx.product.findUnique({
            where: { id: compositeProductId },
            include: { compositeParent: true },
        });
        if (!composite) {
            throw new common_1.NotFoundException('Composite product not found');
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
                throw new common_1.BadRequestException(`Component inventory not found for product: ${item.childProductId}`);
            }
            const requiredQuantity = item.quantity * quantity;
            if (componentInventory.quantity < requiredQuantity) {
                throw new common_1.BadRequestException(`Insufficient inventory for component: ${item.childProductId}`);
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
                    type: client_1.InventoryTransactionType.SALE,
                    quantity: -requiredQuantity,
                    balanceAfter: componentInventory.quantity - requiredQuantity,
                    referenceType: 'sale',
                    referenceId: compositeProductId,
                },
            });
        }
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        audit_service_1.AuditService])
], ProductsService);
//# sourceMappingURL=products.service.js.map