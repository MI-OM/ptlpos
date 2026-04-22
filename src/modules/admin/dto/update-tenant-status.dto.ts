import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
  TRIAL = 'TRIAL',
}

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
