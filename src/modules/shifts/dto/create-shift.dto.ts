import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Limit per page',
    example: 20,
  })
  @IsOptional()
  limit?: number = 20;
}
