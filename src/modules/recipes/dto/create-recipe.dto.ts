import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

class CreateRecipeItemDto {
  @IsString()
  rawMaterialId!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;
}

export class CreateRecipeDto {
  @IsString()
  productId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeItemDto)
  items!: CreateRecipeItemDto[];
}
