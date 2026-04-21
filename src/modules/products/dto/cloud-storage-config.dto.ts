import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum CloudStorageProvider {
  AWS_S3 = 'AWS_S3',
  GOOGLE_CLOUD = 'GOOGLE_CLOUD',
  AZURE_BLOB = 'AZURE_BLOB',
  DIGITAL_OCEAN = 'DIGITAL_OCEAN',
}

export class CloudStorageConfigDto {
  @ApiProperty({
    description: 'Cloud storage provider',
    enum: CloudStorageProvider,
    example: CloudStorageProvider.AWS_S3,
  })
  @IsOptional()
  @IsEnum(CloudStorageProvider)
  provider?: CloudStorageProvider;

  @ApiProperty({
    description: 'Storage configuration',
    example: {
      bucket: 'my-app-products',
      region: 'us-east-1',
      accessKeyId: 'AKIA...',
      secretAccessKey: '...',
      projectId: 'my-project-id',
      connectionString: 'DefaultEndpointsProtocol=https://account.blob.core.windows.net;AccountName=myaccount;AccountKey=...',
    },
  })
  @IsOptional()
  config?: {
    bucket?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    projectId?: string;
    connectionString?: string;
  };

  @ApiProperty({
    description: 'CDN base URL for image delivery',
    example: 'https://cdn.example.com',
  })
  @IsOptional()
  @IsString()
  cdnBaseUrl?: string;
}
