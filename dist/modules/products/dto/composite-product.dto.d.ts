declare class CompositeProductComponentDto {
    productId: string;
    quantity: number;
}
export declare class CompositeProductDto {
    name: string;
    sku: string;
    imageUrl?: string;
    price: number;
    cost?: number;
    taxRate?: number;
    components: CompositeProductComponentDto[];
    openingQuantity?: number;
}
export {};
