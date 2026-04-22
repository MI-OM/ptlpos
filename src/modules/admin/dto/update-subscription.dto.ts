import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsJSON } from 'class-validator';
import { BillingCycle } from '@prisma/client';

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'New plan ID for subscription change',
    example: 'cmo9m3abc123def456ghi',
    required: false,
  })
  @IsOptional()
  planId?: string;

  @ApiProperty({
    description: 'Plan name',
    example: 'Pro Plan',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Advanced features for growing businesses',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Monthly price',
    example: 99.99,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: 'Billing cycle',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
    required: false,
  })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiProperty({
    description: 'Plan limits as JSON',
    example: { users: 50, branches: 10, products: 5000 },
    required: false,
  })
  @IsOptional()
  @IsJSON()
  limits?: string;

  @ApiProperty({
    description: 'Plan features as JSON array',
    example: ['inventory', 'reports', 'api_access', 'multi_branch'],
    required: false,
  })
  @IsOptional()
  @IsJSON()
  features?: string;

  @ApiProperty({
    description: 'Whether the plan is active',
    example: true,
    required: false,
  })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Subscription end date',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  endDate?: Date;
}
