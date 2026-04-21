import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export class UploadProductImageDto {
  @ApiProperty({
    description: 'Product image file',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  file?: MulterFile;

  @ApiProperty({
    description: 'Image metadata (optional)',
    example: {
      alt: 'Product image',
      caption: 'Product description',
      tags: ['laptop', 'electronics'],
    },
  })
  @IsOptional()
  metadata?: {
    alt?: string;
    caption?: string;
    tags?: string[];
  };

  @ApiProperty({
    description: 'Upload configuration',
    example: {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 80,
      format: ['jpg', 'png', 'webp'],
      maxSize: 5242880, // 5MB
    },
  })
  @IsOptional()
  config?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: string[];
    maxSize?: number;
  };
}
