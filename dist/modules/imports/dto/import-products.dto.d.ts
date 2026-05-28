declare class ImportProductItem {
    name: string;
    sku: string;
    price: number;
    cost?: number;
    taxRate?: number;
}
export declare class ImportProductsDto {
    products: ImportProductItem[];
}
export {};
