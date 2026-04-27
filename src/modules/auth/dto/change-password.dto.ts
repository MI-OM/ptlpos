import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password for verification',
    example: 'OldPassword123!',
  })
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewPassword456!',
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
