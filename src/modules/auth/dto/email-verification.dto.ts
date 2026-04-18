import { IsEmail, IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestEmailVerificationDto {
  @ApiProperty({
    description: 'Organization email for verification',
    example: 'contact@acme.com',
  })
  @IsEmail()
  email!: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Verification token received via email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  token!: string;
}

export class RequestPasswordResetDto {
  @ApiProperty({
    description: 'User email address for password reset',
    example: 'john@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Tenant ID',
    example: 'clh7x1q0a0000qa10f0f0f0f0',
  })
  @IsString()
  tenantId!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token received via email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  token!: string;

  @ApiProperty({
    description: 'New password (minimum 6 characters)',
    example: 'NewSecurePass123',
  })
  @IsString()
  newPassword!: string;
}
