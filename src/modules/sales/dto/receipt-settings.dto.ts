import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReceiptSettingsDto {
  @ApiPropertyOptional({
    description: 'Show business name on receipt',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showBusinessName?: boolean;

  @ApiPropertyOptional({
    description: 'Show business phone on receipt',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showPhone?: boolean;

  @ApiPropertyOptional({
    description: 'Show business address on receipt',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showAddress?: boolean;

  @ApiPropertyOptional({
    description: 'Show business email on receipt',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @ApiPropertyOptional({
    description: 'Show receipt number',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showReceiptNumber?: boolean;

  @ApiPropertyOptional({
    description: 'Show customer name on receipt',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showCustomerName?: boolean;

  @ApiPropertyOptional({
    description: 'Show customer phone on receipt',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  showCustomerPhone?: boolean;

  @ApiPropertyOptional({
    description: 'Custom header text',
    example: 'Thank you for shopping with us!',
  })
  @IsOptional()
  @IsString()
  customHeader?: string;

  @ApiPropertyOptional({
    description: 'Custom footer text',
    example: 'Please come again!',
  })
  @IsOptional()
  @IsString()
  customFooter?: string;

  @ApiPropertyOptional({
    description: 'Show "Powered by PTLPOS" message',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  showPoweredBy?: boolean;
}
