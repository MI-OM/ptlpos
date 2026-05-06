import { PaymentMethod, SaleStatus } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsPositive,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSaleItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'prod-123',
    required: true,
  })
  @IsString()
  productId!: string;

  @ApiPropertyOptional({
    description: 'Product variant ID (if product has variants)',
    example: 'variant-456',
  })
  @IsOptional()
  @IsString()
  productVariantId?: string;

  @ApiProperty({
    description: 'Quantity of items',
    example: 2,
    required: true,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Unit price (overrides default product price)',
    example: 49.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({
    description: 'Discount amount per item',
    example: 5.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Tax rate for this item (as decimal, e.g., 0.08 for 8%)',
    example: 0.08,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;
}

export class SalePaymentDto {
  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: 'CASH',
    required: true,
  })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({
    description: 'Payment amount',
    example: 99.99,
    required: true,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({
    description: 'Payment reference number (for checks, cards, etc.)',
    example: 'CHK-12345',
  })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class CreateSaleDto {
  @ApiPropertyOptional({
    description: 'Customer ID (optional for anonymous sales)',
    example: 'customer-123',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Discount amount for the entire sale',
    example: 10.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Sale notes or comments',
    example: 'Customer requested gift wrapping',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Tax rate for the entire sale (as decimal, e.g., 0.08 for 8%)',
    example: 0.08,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiProperty({
    description: 'List of items in the sale',
    type: [CreateSaleItemDto],
    required: true,
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  @ApiPropertyOptional({
    description: 'Payment information (optional for creating draft sales)',
    type: [SalePaymentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments?: SalePaymentDto[];
}

export class CompleteSaleDto {
  @ApiProperty({
    description: 'Payment information to complete the sale',
    type: [SalePaymentDto],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments!: SalePaymentDto[];
}

export class RefundSaleItemDto {
  @ApiProperty({
    description: 'Sale item ID to refund',
    example: 'sale-item-123',
    required: true,
  })
  @IsString()
  saleItemId!: string;

  @ApiProperty({
    description: 'Quantity to refund',
    example: 1,
    required: true,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;
}

export class RefundSaleDto {
  @ApiPropertyOptional({
    description: 'Reason for refund',
    example: 'Customer requested refund - product defective',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Items to refund (if not specified, full sale is refunded)',
    type: [RefundSaleItemDto],
    minItems: 1,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RefundSaleItemDto)
  items?: RefundSaleItemDto[];
}

export class AddSaleItemDto extends CreateSaleItemDto {}

export class RemoveSaleItemDto {
  @ApiProperty({
    description: 'Sale item ID to remove',
    example: 'sale-item-123',
    required: true,
  })
  @IsString()
  saleItemId!: string;
}

export class UpdateSaleItemDto {
  @ApiProperty({
    description: 'New quantity for the item',
    example: 3,
    required: true,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional({
    description: 'New unit price (overrides default)',
    example: 49.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({
    description: 'New discount amount per item',
    example: 5.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;
}

export class QuerySalesDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 15,
    default: 15,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 15;

  @ApiPropertyOptional({
    description: 'Filter by sale status',
    enum: SaleStatus,
    example: SaleStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;
}
