import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class EndOfDayReportQueryDto {
  @ApiProperty({ description: 'Date for the report (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ description: 'Branch ID to filter', required: false })
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class EndOfShiftReportQueryDto {
  @ApiProperty({ description: 'Shift ID for the report' })
  @IsString()
  shiftId: string;
}

export class SalesPerformanceQueryDto {
  @ApiProperty({ description: 'User ID to filter', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiProperty({ description: 'Branch ID to filter', required: false })
  @IsOptional()
  @IsString()
  branchId?: string;
}
