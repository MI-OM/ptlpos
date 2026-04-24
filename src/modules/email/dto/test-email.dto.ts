import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class TestEmailDto {
  @ApiProperty({
    description: 'Email address to send test email to',
    example: 'test@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Custom message for the test email',
    example: 'This is a test email from PTLPOS',
    required: false,
  })
  @IsString()
  message?: string;
}
