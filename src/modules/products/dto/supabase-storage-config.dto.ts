import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SupabaseStorageConfigDto {
  @ApiProperty({
    description: 'Supabase project URL',
    example: 'https://your-project.supabase.co',
  })
  @IsString()
  url!: string;

  @ApiProperty({
    description: 'Supabase service role key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  serviceKey!: string;

  @ApiProperty({
    description: 'Storage bucket name',
    example: 'product-images',
  })
  @IsString()
  bucket!: string;

  @ApiProperty({
    description: 'Public storage bucket',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  public?: boolean;

  @ApiProperty({
    description: 'Allowed file types',
    example: ['jpg', 'jpeg', 'png', 'webp'],
  })
  @IsOptional()
  allowedTypes?: string[];

  @ApiProperty({
    description: 'Maximum file size in bytes',
    example: 5242880, // 5MB
  })
  @IsOptional()
  maxSize?: number;
}
