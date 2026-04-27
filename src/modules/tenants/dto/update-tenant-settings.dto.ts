import { IsNumber, IsOptional, IsObject, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantSettingsDto {
  @ApiPropertyOptional({
    description: 'Default tax rate',
    example: 0.10,
  })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Enable tax calculation',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  taxEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Tax ID/VAT number',
    example: 'VAT123456',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Custom settings as JSON object',
    example: { customField: 'value' },
  })
  @IsOptional()
  @IsObject()
  custom?: Record<string, any>;
}
