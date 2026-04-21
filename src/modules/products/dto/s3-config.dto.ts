import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class S3ConfigDto {
  @ApiProperty({
    description: 'S3 bucket configuration',
    example: {
      bucket: 'my-app-products',
      region: 'us-east-1',
      accessKeyId: 'AKIA...',
      secretAccessKey: '...',
    },
  })
  @IsOptional()
  bucket?: string;

  @ApiProperty({
    description: 'S3 region',
    example: 'us-east-1',
  })
  @IsOptional()
  region?: string;

  @ApiProperty({
    description: 'CDN base URL for image delivery',
    example: 'https://cdn.example.com',
  })
  @IsOptional()
  cdnBaseUrl?: string;
}
