import { StocktakeStatus } from '@prisma/client';
export declare class CreateStocktakeDto {
    name: string;
    notes?: string;
}
export declare class StocktakeLineItemDto {
    productId: string;
    productVariantId?: string;
    physicalCount: number;
    notes?: string;
}
export declare class RecordStocktakeCountsDto {
    items: StocktakeLineItemDto[];
}
export declare class UpdateStocktakeStatusDto {
    status: StocktakeStatus;
}
