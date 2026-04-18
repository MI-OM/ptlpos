import { IsNumber, IsPositive, IsString } from 'class-validator';

export class RunProductionDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @IsPositive()
  quantityProduced!: number;
}
