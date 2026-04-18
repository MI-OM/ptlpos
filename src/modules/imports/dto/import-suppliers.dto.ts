import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

class ImportSupplierItem {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ImportSuppliersDto {
  @IsArray()
  @Type(() => ImportSupplierItem)
  suppliers!: ImportSupplierItem[];
}
