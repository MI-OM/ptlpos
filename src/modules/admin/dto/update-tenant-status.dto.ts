import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TenantStatus } from '@prisma/client';

export class UpdateTenantStatusDto {
  @ApiProperty({
    description: 'New tenant status',
    enum: TenantStatus,
    example: TenantStatus.SUSPENDED,
  })
  @IsEnum(TenantStatus)
  status!: TenantStatus;

  @ApiProperty({
    description: 'Reason for status change',
    example: 'Non-payment of subscription',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
