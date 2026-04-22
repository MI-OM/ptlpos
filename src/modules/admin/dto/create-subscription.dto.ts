import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsJSON } from 'class-validator';
import { BillingCycle } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Plan name',
    example: 'Pro Plan',
  })
  @IsString()
  name!: string;

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
  })
  @IsNumber()
  price!: number;

  @ApiProperty({
    description: 'Billing cycle',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;

  @ApiProperty({
    description: 'Plan limits as JSON',
    example: { users: 50, branches: 10, products: 5000 },
  })
  @IsJSON()
  limits!: string;

  @ApiProperty({
    description: 'Plan features as JSON array',
    example: ['inventory', 'reports', 'api_access', 'multi_branch'],
  })
  @IsJSON()
  features!: string;

  @ApiProperty({
    description: 'Whether the plan is active',
    example: true,
    required: false,
  })
  @IsOptional()
  isActive?: boolean;
}
