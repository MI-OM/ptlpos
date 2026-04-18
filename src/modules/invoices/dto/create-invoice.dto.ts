import { IsOptional, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  saleId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
