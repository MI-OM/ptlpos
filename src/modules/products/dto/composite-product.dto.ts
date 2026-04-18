import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

class CompositeProductComponentDto {
  @IsString()
  productId!: string;

  @IsNumber()
  quantity!: number;
}

export class CompositeProductDto {
  @IsString()
  name!: string;

  @IsString()
  sku!: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @IsArray()
  @Type(() => CompositeProductComponentDto)
  components!: CompositeProductComponentDto[];

  @IsOptional()
  @IsNumber()
  openingQuantity?: number;
}
