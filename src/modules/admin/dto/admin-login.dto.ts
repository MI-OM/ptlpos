import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@ptlpos.com',
    required: true,
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'Admin123!',
    required: true,
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
