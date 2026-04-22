import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({
    description: 'Branch name',
    example: 'Main Store',
    required: true,
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Street address',
    example: '123 Main Street',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'City name',
    example: 'New York',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State or province',
    example: 'NY',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'ZIP or postal code',
    example: '10001',
  })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({
    description: 'Country name',
    example: 'USA',
  })
  @IsOptional()
  @IsString()
  country?: string;
}

export class UpdateBranchDto {
  @ApiPropertyOptional({
    description: 'Branch name',
    example: 'Updated Store Name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Street address',
    example: '456 Updated Street',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'City name',
    example: 'Boston',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State or province',
    example: 'MA',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'ZIP or postal code',
    example: '02101',
  })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({
    description: 'Country name',
    example: 'USA',
  })
  @IsOptional()
  @IsString()
  country?: string;
}
