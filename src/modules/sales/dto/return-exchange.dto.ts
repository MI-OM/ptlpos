import { IsArray, IsEnum, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReturnExchangeType {
  RETURN = 'RETURN',
  EXCHANGE = 'EXCHANGE',
  RETURN_AND_EXCHANGE = 'RETURN_AND_EXCHANGE',
}

export class ReturnItemDto {
  @ApiProperty({
    description: 'Sale item ID to return',
    example: 'sale-item-123',
  })
  @IsString()
  saleItemId!: string;

  @ApiProperty({
    description: 'Quantity to return',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;
}

export class ExchangeItemDto {
  @ApiProperty({
    description: 'Product ID to exchange for',
    example: 'product-456',
  })
  @IsString()
  productId!: string;

  @ApiPropertyOptional({
    description: 'Product variant ID (if variant product)',
    example: 'variant-789',
  })
  @IsOptional()
  @IsString()
  productVariantId?: string;

  @ApiProperty({
    description: 'Quantity to exchange for',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;
}

export class ReturnExchangeDto {
  @ApiProperty({
    description: 'Type of return/exchange',
    enum: ReturnExchangeType,
    example: ReturnExchangeType.EXCHANGE,
  })
  @IsEnum(ReturnExchangeType)
  type!: ReturnExchangeType;

  @ApiProperty({
    description: 'Items to return',
    type: [ReturnItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  returnItems!: ReturnItemDto[];

  @ApiPropertyOptional({
    description: 'Items to exchange for (required for EXCHANGE and RETURN_AND_EXCHANGE)',
    type: [ExchangeItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExchangeItemDto)
  exchangeItems?: ExchangeItemDto[];

  @ApiPropertyOptional({
    description: 'Reason for return/exchange',
    example: 'Wrong size',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Customer wants a larger size',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
