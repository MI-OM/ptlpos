import { InventoryTransactionType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdjustInventoryDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  productVariantId?: string;

  @IsNumber()
  quantity!: number;

  @IsEnum(InventoryTransactionType)
  type!: InventoryTransactionType;

  @IsOptional()
  @IsString()
  note?: string;
}
