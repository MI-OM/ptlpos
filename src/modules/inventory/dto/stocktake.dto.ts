import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StocktakeStatus } from '@prisma/client';

export class CreateStocktakeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StocktakeLineItemDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  productVariantId?: string;

  @IsNumber()
  @Min(0)
  physicalCount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordStocktakeCountsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StocktakeLineItemDto)
  items!: StocktakeLineItemDto[];
}

export class UpdateStocktakeStatusDto {
  @IsString()
  status!: StocktakeStatus;
}
