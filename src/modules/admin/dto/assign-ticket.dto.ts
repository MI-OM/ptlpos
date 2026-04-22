import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignTicketDto {
  @ApiProperty({
    description: 'Admin user ID to assign the ticket to',
    example: 'cmo9m3qxy1000k67o4ge49x64',
  })
  @IsUUID()
  assignedTo!: string;
}
