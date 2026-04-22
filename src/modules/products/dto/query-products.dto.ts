import { ProductType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, IsUUID, IsBoolean } from 'class-validator';

export class QueryProductsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeVariants?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeInventory?: boolean;
}
