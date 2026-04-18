import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Organization or business name',
    example: 'Acme Corporation',
  })
  @IsString()
  name!: string;
}
