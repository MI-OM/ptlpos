export declare enum ReturnExchangeType {
    RETURN = "RETURN",
    EXCHANGE = "EXCHANGE",
    RETURN_AND_EXCHANGE = "RETURN_AND_EXCHANGE"
}
export declare class ReturnItemDto {
    saleItemId: string;
    quantity: number;
}
export declare class ExchangeItemDto {
    productId: string;
    productVariantId?: string;
    quantity: number;
}
export declare class ReturnExchangeDto {
    type: ReturnExchangeType;
    returnItems: ReturnItemDto[];
    exchangeItems?: ExchangeItemDto[];
    reason?: string;
    notes?: string;
}
