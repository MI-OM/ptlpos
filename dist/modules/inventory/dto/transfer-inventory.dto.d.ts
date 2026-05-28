export declare class TransferInventoryItemDto {
    productId: string;
    productVariantId?: string;
    quantity: number;
    note?: string;
}
export declare class TransferInventoryDto {
    targetBranchId: string;
    note?: string;
    items: TransferInventoryItemDto[];
}
