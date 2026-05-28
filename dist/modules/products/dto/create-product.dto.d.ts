import { ProductType } from '@prisma/client';
declare class CreateProductVariantDto {
    name: string;
    sku: string;
    barcode?: string;
    price?: number;
    openingQuantity?: number;
}
export declare class CreateProductDto {
    name: string;
    sku: string;
    barcode?: string;
    imageUrl?: string;
    type: ProductType;
    price: number;
    cost: number;
    taxRate?: number;
    categoryId?: string;
    openingQuantity?: number;
    variants?: CreateProductVariantDto[];
}
export {};
