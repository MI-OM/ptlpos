import { Prisma } from '@prisma/client';
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
export declare class ProductsService {
    private readonly prisma;
    private readonly redis;
    private readonly audit;
    private readonly supabaseStorage;
    constructor(prisma: PrismaService, redis: RedisService, audit: AuditService);
    findAll(tenantId: string, query: QueryProductsDto): Promise<any>;
    findOne(tenantId: string, id: string): Promise<{
        category: {
            id: string;
            tenantId: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        variants: {
            id: string;
            productId: string;
            name: string;
            sku: string;
            price: Prisma.Decimal | null;
            imageUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        inventoryRows: {
            id: string;
            tenantId: string;
            branchId: string | null;
            productId: string;
            productVariantId: string | null;
            quantity: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        }[];
        compositeParent: ({
            child: {
                id: string;
                tenantId: string;
                categoryId: string | null;
                name: string;
                sku: string | null;
                barcode: string | null;
                imageUrl: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                price: Prisma.Decimal;
                cost: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            parentId: string;
            childProductId: string;
            quantity: Prisma.Decimal;
            createdAt: Date;
        })[];
    } & {
        id: string;
        tenantId: string;
        categoryId: string | null;
        name: string;
        sku: string | null;
        barcode: string | null;
        imageUrl: string | null;
        type: import(".prisma/client").$Enums.ProductType;
        price: Prisma.Decimal;
        cost: Prisma.Decimal;
        taxRate: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(context: AuthContext, dto: CreateProductDto): Promise<{
        id: string;
        tenantId: string;
        categoryId: string | null;
        name: string;
        sku: string | null;
        barcode: string | null;
        imageUrl: string | null;
        type: import(".prisma/client").$Enums.ProductType;
        price: Prisma.Decimal;
        cost: Prisma.Decimal;
        taxRate: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(context: AuthContext, id: string, dto: UpdateProductDto): Promise<{
        id: string;
        tenantId: string;
        categoryId: string | null;
        name: string;
        sku: string | null;
        barcode: string | null;
        imageUrl: string | null;
        type: import(".prisma/client").$Enums.ProductType;
        price: Prisma.Decimal;
        cost: Prisma.Decimal;
        taxRate: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    uploadProductImage(user: AuthContext, productId: string, file: MulterFile, metadata?: {
        alt?: string;
        caption?: string;
        tags?: string[];
    }): Promise<UploadProductImageResponseDto>;
    uploadMultipleProductImages(user: AuthContext, productId: string, files: MulterFile[], metadata?: {
        alt?: string;
        caption?: string;
        tags?: string[];
    }): Promise<UploadProductImageResponseDto[]>;
    deleteProductImage(user: AuthContext, productId: string, imageId: string): Promise<{
        success: boolean;
    }>;
    remove(context: AuthContext, id: string): Promise<{
        success: boolean;
    }>;
    createComposite(context: AuthContext, dto: CompositeProductDto): Promise<{
        compositeParent: ({
            child: {
                id: string;
                tenantId: string;
                categoryId: string | null;
                name: string;
                sku: string | null;
                barcode: string | null;
                imageUrl: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                price: Prisma.Decimal;
                cost: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            parentId: string;
            childProductId: string;
            quantity: Prisma.Decimal;
            createdAt: Date;
        })[];
    } & {
        id: string;
        tenantId: string;
        categoryId: string | null;
        name: string;
        sku: string | null;
        barcode: string | null;
        imageUrl: string | null;
        type: import(".prisma/client").$Enums.ProductType;
        price: Prisma.Decimal;
        cost: Prisma.Decimal;
        taxRate: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getComposite(tenantId: string, productId: string): Promise<{
        inventoryRows: {
            id: string;
            tenantId: string;
            branchId: string | null;
            productId: string;
            productVariantId: string | null;
            quantity: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        }[];
        compositeParent: ({
            child: {
                variants: {
                    id: string;
                    productId: string;
                    name: string;
                    sku: string;
                    price: Prisma.Decimal | null;
                    imageUrl: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
            } & {
                id: string;
                tenantId: string;
                categoryId: string | null;
                name: string;
                sku: string | null;
                barcode: string | null;
                imageUrl: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                price: Prisma.Decimal;
                cost: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            parentId: string;
            childProductId: string;
            quantity: Prisma.Decimal;
            createdAt: Date;
        })[];
    } & {
        id: string;
        tenantId: string;
        categoryId: string | null;
        name: string;
        sku: string | null;
        barcode: string | null;
        imageUrl: string | null;
        type: import(".prisma/client").$Enums.ProductType;
        price: Prisma.Decimal;
        cost: Prisma.Decimal;
        taxRate: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getProductHistory(tenantId: string, productId: string, page?: number, limit?: number, type?: string): Promise<{
        data: ({
            product: {
                id: string;
                tenantId: string;
                categoryId: string | null;
                name: string;
                sku: string | null;
                barcode: string | null;
                imageUrl: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                price: Prisma.Decimal;
                cost: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
            productVariant: {
                id: string;
                productId: string;
                name: string;
                sku: string;
                price: Prisma.Decimal | null;
                imageUrl: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            tenantId: string;
            branchId: string | null;
            productId: string;
            productVariantId: string | null;
            type: import(".prisma/client").$Enums.InventoryTransactionType;
            quantity: Prisma.Decimal;
            balanceAfter: Prisma.Decimal;
            referenceType: string;
            referenceId: string;
            note: string | null;
            createdAt: Date;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    getCompositeWithInventory(tenantId: string, productId: string): Promise<{
        product: {
            inventoryRows: {
                id: string;
                tenantId: string;
                branchId: string | null;
                productId: string;
                productVariantId: string | null;
                quantity: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            }[];
            compositeParent: ({
                child: {
                    variants: {
                        id: string;
                        productId: string;
                        name: string;
                        sku: string;
                        price: Prisma.Decimal | null;
                        imageUrl: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    }[];
                } & {
                    id: string;
                    tenantId: string;
                    categoryId: string | null;
                    name: string;
                    sku: string | null;
                    barcode: string | null;
                    imageUrl: string | null;
                    type: import(".prisma/client").$Enums.ProductType;
                    price: Prisma.Decimal;
                    cost: Prisma.Decimal;
                    taxRate: Prisma.Decimal;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                parentId: string;
                childProductId: string;
                quantity: Prisma.Decimal;
                createdAt: Date;
            })[];
        } & {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: Prisma.Decimal;
            cost: Prisma.Decimal;
            taxRate: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        components: {
            component: {
                variants: {
                    id: string;
                    productId: string;
                    name: string;
                    sku: string;
                    price: Prisma.Decimal | null;
                    imageUrl: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
            } & {
                id: string;
                tenantId: string;
                categoryId: string | null;
                name: string;
                sku: string | null;
                barcode: string | null;
                imageUrl: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                price: Prisma.Decimal;
                cost: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
            quantity: Prisma.Decimal;
            availableStock: number | Prisma.Decimal;
            canFulfill: boolean;
        }[];
    }>;
    deductCompositeComponents(tx: any, tenantId: string, compositeProductId: string, quantity: number): Promise<void>;
}
export {};
