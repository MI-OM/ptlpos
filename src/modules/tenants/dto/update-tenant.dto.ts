import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: 'Organization/Business name',
    example: 'Acme Corporation Updated',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
