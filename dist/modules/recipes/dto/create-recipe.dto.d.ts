declare class CreateRecipeItemDto {
    rawMaterialId: string;
    quantity: number;
}
export declare class CreateRecipeDto {
    productId: string;
    items: CreateRecipeItemDto[];
}
export {};
