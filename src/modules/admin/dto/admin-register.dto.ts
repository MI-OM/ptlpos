import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';

enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUPPORT_ADMIN = 'SUPPORT_ADMIN',
  BILLING_ADMIN = 'BILLING_ADMIN',
}

export class AdminRegisterDto {
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

  @ApiProperty({
    description: 'Admin first name',
    example: 'John',
    required: true,
  })
  @IsString()
  firstName!: string;

  @ApiProperty({
    description: 'Admin last name',
    example: 'Doe',
    required: true,
  })
  @IsString()
  lastName!: string;

  @ApiProperty({
    description: 'Admin role',
    example: 'SUPER_ADMIN',
    enum: ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'BILLING_ADMIN'],
    required: true,
  })
  @IsEnum(AdminRole)
  role!: AdminRole;
}
