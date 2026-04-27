import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

export class ReconcileShiftDto {
  @ApiProperty({ description: 'Actual cash amount counted' })
  @IsNumber()
  @Type(() => Number)
  actualCash: number;

  @ApiProperty({ description: 'Actual card amount counted', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  actualCard?: number;

  @ApiProperty({ description: 'Actual transfer amount counted', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  actualTransfer?: number;

  @ApiProperty({ description: 'Actual mobile payment amount counted', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  actualMobile?: number;

  @ApiProperty({ description: 'Notes about the reconciliation', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
