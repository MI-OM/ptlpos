import { PurchaseOrderStatus } from '@prisma/client';
declare class CreatePurchaseOrderItemDto {
    productId: string;
    quantity: number;
    cost: number;
}
export declare class CreatePurchaseOrderDto {
    supplierId: string;
    status?: PurchaseOrderStatus;
    items: CreatePurchaseOrderItemDto[];
}
export {};
