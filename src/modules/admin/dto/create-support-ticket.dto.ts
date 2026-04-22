import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';

enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

enum TicketCategory {
  BILLING = 'BILLING',
  TECHNICAL = 'TECHNICAL',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  BUG_REPORT = 'BUG_REPORT',
  ACCOUNT_ISSUE = 'ACCOUNT_ISSUE',
  OTHER = 'OTHER',
}

export class CreateSupportTicketDto {
  @ApiProperty({
    description: 'Tenant ID',
    example: 'cmo9m3pup0000k67o4ge49x62',
  })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'User ID who created the ticket',
    example: 'cmo9m3qxy1000k67o4ge49x63',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Ticket subject',
    example: 'Issue with inventory synchronization',
  })
  @IsString()
  subject!: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'The inventory is not syncing across multiple branches. When we update stock in one branch, it does not reflect in others.',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Ticket priority',
    enum: TicketPriority,
    example: TicketPriority.HIGH,
  })
  @IsEnum(TicketPriority)
  priority!: TicketPriority;

  @ApiProperty({
    description: 'Ticket category',
    enum: TicketCategory,
    example: TicketCategory.TECHNICAL,
  })
  @IsEnum(TicketCategory)
  category!: TicketCategory;
}
