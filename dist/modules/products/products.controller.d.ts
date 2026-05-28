import { AuthContext } from '../../core/types/request-context';
import { CreateProductDto } from './dto/create-product.dto';
import { CompositeProductDto } from './dto/composite-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadProductImageResponseDto } from './dto/upload-product-image-response.dto';
import { ProductsService } from './products.service';
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
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(user: AuthContext, query: QueryProductsDto): Promise<any>;
    create(user: AuthContext, dto: CreateProductDto): Promise<{
        id: string;
        tenantId: string;
        categoryId: string | null;
        name: string;
        sku: string | null;
        barcode: string | null;
        imageUrl: string | null;
        type: import(".prisma/client").$Enums.ProductType;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal;
        taxRate: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthContext, id: string, dto: UpdateProductDto): Promise<{
        id: string;
        tenantId: string;
        categoryId: string | null;
        name: string;
        sku: string | null;
        barcode: string | null;
        imageUrl: string | null;
        type: import(".prisma/client").$Enums.ProductType;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal;
        taxRate: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createComposite(user: AuthContext, dto: CompositeProductDto): Promise<{
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
                price: import("@prisma/client/runtime/library").Decimal;
                cost: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            parentId: string;
            childProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal;
        taxRate: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getComposite(user: AuthContext, id: string): Promise<{
        inventoryRows: {
            id: string;
            tenantId: string;
            branchId: string | null;
            productId: string;
            productVariantId: string | null;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
                    price: import("@prisma/client/runtime/library").Decimal | null;
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
                price: import("@prisma/client/runtime/library").Decimal;
                cost: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            parentId: string;
            childProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal;
        taxRate: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getCompositeWithInventory(user: AuthContext, id: string): Promise<{
        product: {
            inventoryRows: {
                id: string;
                tenantId: string;
                branchId: string | null;
                productId: string;
                productVariantId: string | null;
                quantity: import("@prisma/client/runtime/library").Decimal;
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
                        price: import("@prisma/client/runtime/library").Decimal | null;
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
                    price: import("@prisma/client/runtime/library").Decimal;
                    cost: import("@prisma/client/runtime/library").Decimal;
                    taxRate: import("@prisma/client/runtime/library").Decimal;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                parentId: string;
                childProductId: string;
                quantity: import("@prisma/client/runtime/library").Decimal;
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
            price: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
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
                    price: import("@prisma/client/runtime/library").Decimal | null;
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
                price: import("@prisma/client/runtime/library").Decimal;
                cost: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
            quantity: import("@prisma/client/runtime/library").Decimal;
            availableStock: number | import("@prisma/client/runtime/library").Decimal;
            canFulfill: boolean;
        }[];
    }>;
    getProductHistory(user: AuthContext, id: string, page?: string, limit?: string, type?: string): Promise<{
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
                price: import("@prisma/client/runtime/library").Decimal;
                cost: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
            productVariant: {
                id: string;
                productId: string;
                name: string;
                sku: string;
                price: import("@prisma/client/runtime/library").Decimal | null;
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
            quantity: import("@prisma/client/runtime/library").Decimal;
            balanceAfter: import("@prisma/client/runtime/library").Decimal;
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
    uploadProductImage(user: AuthContext, id: string, file: MulterFile, metadata?: {
        alt?: string;
        caption?: string;
        tags?: string[];
    }): Promise<UploadProductImageResponseDto>;
    uploadMultipleProductImages(user: AuthContext, id: string, files: MulterFile[], metadata?: {
        alt?: string;
        caption?: string;
        tags?: string[];
    }): Promise<UploadProductImageResponseDto[]>;
    deleteProductImage(user: AuthContext, id: string, imageId: string): Promise<{
        success: boolean;
    }>;
    remove(user: AuthContext, id: string): Promise<{
        success: boolean;
    }>;
}
export {};
