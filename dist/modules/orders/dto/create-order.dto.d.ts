declare class CreateOrderItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
}
export declare class CreateOrderDto {
    customerId?: string;
    branchId: string;
    items: CreateOrderItemDto[];
}
export {};
