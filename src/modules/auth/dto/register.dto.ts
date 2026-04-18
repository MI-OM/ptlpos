import { IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Organization/Business name',
    example: 'Acme Corporation',
  })
  @IsString()
  organizationName!: string;

  @ApiProperty({
    description: 'Primary user full name',
    example: 'John Doe',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Primary user email address',
    example: 'john@acme.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Password (minimum 6 characters)',
    example: 'SecurePass123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
