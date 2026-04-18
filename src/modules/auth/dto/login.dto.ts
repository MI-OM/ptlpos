import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Tenant/Organization ID',
    example: 'clh7x1q0a0000qa10f0f0f0f0',
  })
  @IsString()
  tenantId!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
