import { ProductType } from '@prisma/client';
export declare class QueryProductsDto {
    page?: number;
    limit?: number;
    q?: string;
    sku?: string;
    barcode?: string;
    type?: ProductType;
    categoryId?: string;
    includeVariants?: boolean;
    includeInventory?: boolean;
}
