import { ProductType } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateProductVariantDto {
  @ApiProperty({
    description: 'Variant name (e.g., "Small", "Red", "Large")',
    example: 'Large',
    required: true,
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Variant SKU (unique identifier)',
    example: 'SHIRT-LRG-BLK',
    required: true,
  })
  @IsString()
  sku!: string;

  @ApiPropertyOptional({
    description: 'Variant price (overrides base product price)',
    example: 29.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    description: 'Opening stock quantity for this variant',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  openingQuantity?: number;
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'White T-Shirt',
    required: true,
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Product SKU (unique identifier)',
    example: 'SHIRT-WHT-SML',
    required: true,
  })
  @IsString()
  sku!: string;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://example.com/images/shirt.jpg',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({
    description: 'Product type',
    enum: ProductType,
    example: 'SIMPLE',
    required: true,
  })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiProperty({
    description: 'Selling price',
    example: 19.99,
    required: true,
    minimum: 0,
  })
  @IsNumber()
  price!: number;

  @ApiProperty({
    description: 'Cost price',
    example: 10.00,
    required: true,
    minimum: 0,
  })
  @IsNumber()
  cost!: number;

  @ApiPropertyOptional({
    description: 'Tax rate (as decimal, e.g., 0.08 for 8%)',
    example: 0.08,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Product category ID',
    example: 'cmo9mytni0001tvl4oi7c56we',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Opening stock quantity',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  openingQuantity?: number;

  @ApiPropertyOptional({
    description: 'Product variants (for VARIANT type products)',
    type: [CreateProductVariantDto],
    minItems: 1,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}
