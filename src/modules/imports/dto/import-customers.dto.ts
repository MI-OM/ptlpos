import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

class ImportCustomerItem {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ImportCustomersDto {
  @IsArray()
  @Type(() => ImportCustomerItem)
  customers!: ImportCustomerItem[];
}
