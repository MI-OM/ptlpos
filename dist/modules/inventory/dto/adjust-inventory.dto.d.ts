import { InventoryTransactionType } from '@prisma/client';
export declare class AdjustInventoryDto {
    productId: string;
    productVariantId?: string;
    quantity: number;
    type: InventoryTransactionType;
    note?: string;
}
