import { IsNumber, IsOptional, IsString, Min, IsEnum, IsInt, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DrawerType } from '@prisma/client';

export class OpenShiftDto {
  @ApiProperty({
    description: 'Opening cash balance in drawer',
    example: 100.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  openingBalance!: number;

  @ApiPropertyOptional({
    description: 'Type of drawer being used',
    enum: DrawerType,
    example: DrawerType.OFFLINE,
  })
  @IsOptional()
  @IsEnum(DrawerType)
  drawerType?: DrawerType;

  @ApiPropertyOptional({
    description: 'Branch ID for this shift',
    example: 'branch-123',
  })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Notes about opening the shift',
    example: 'Starting morning shift',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloseShiftDto {
  @ApiProperty({
    description: 'Closing cash balance in drawer',
    example: 350.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  closingBalance!: number;

  @ApiPropertyOptional({
    description: 'Notes about closing the shift',
    example: 'End of day - cash count matches',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryShiftsDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Limit per page',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by status (OPEN or CLOSED)',
    example: 'OPEN',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by branch ID',
    example: 'branch-123',
  })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Filter shifts from this date (ISO)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter shifts to this date (ISO)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsString()
  toDate?: string;
}
