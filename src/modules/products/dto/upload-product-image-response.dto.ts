import { ApiProperty } from '@nestjs/swagger';

export class UploadProductImageResponseDto {
  @ApiProperty({
    description: 'Upload success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Image URL after upload',
    example: 'https://cdn.example.com/products/laptop-pro.jpg',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'Image metadata',
    example: {
      filename: 'laptop-pro.jpg',
      size: 1024000,
      format: 'jpeg',
      cdnUrl: 'https://cdn.example.com/products/laptop-pro.jpg',
    },
  })
  metadata?: {
    filename: string;
    size: number;
    format: string;
    cdnUrl: string;
  };
}
