import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

class ImportProductItem {
  @IsString()
  name!: string;

  @IsString()
  sku!: string;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;
}

export class ImportProductsDto {
  @IsArray()
  @Type(() => ImportProductItem)
  products!: ImportProductItem[];
}
