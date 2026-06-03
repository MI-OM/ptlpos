import { PaymentMethod, SaleStatus } from '@prisma/client';
export declare class CreateSaleItemDto {
    productId: string;
    productVariantId?: string;
    quantity: number;
    price?: number;
    discountAmount?: number;
    taxRate?: number;
}
export declare class SalePaymentDto {
    method: PaymentMethod;
    amount: number;
    reference?: string;
}
export declare class CreateSaleDto {
    customerId?: string;
    discountAmount?: number;
    note?: string;
    taxRate?: number;
    items: CreateSaleItemDto[];
    payments?: SalePaymentDto[];
}
export declare class CompleteSaleDto {
    payments?: SalePaymentDto[];
}
export declare class RefundSaleItemDto {
    saleItemId: string;
    quantity: number;
}
export declare class RefundSaleDto {
    reason?: string;
    items?: RefundSaleItemDto[];
}
export declare class AddSaleItemDto extends CreateSaleItemDto {
}
export declare class RemoveSaleItemDto {
    saleItemId: string;
}
export declare class UpdateSaleItemDto {
    quantity: number;
    price?: number;
    discountAmount?: number;
}
export declare class QuerySalesDto {
    page?: number;
    limit?: number;
    status?: SaleStatus;
}
