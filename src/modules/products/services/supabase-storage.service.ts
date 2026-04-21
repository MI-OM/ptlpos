import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseStorageConfigDto } from '../dto/supabase-storage-config.dto';
import { UploadProductImageResponseDto } from '../dto/upload-product-image-response.dto';

// Mock Supabase implementation for build purposes
class MockSupabaseClient {
  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: any, options?: any) => ({ data: { path: 'mock-path' }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: 'mock-url' } }),
      remove: async (path: string | string[]) => ({ data: {}, error: null }),
    }),
  };
}

function createClient(url: string, key: string): MockSupabaseClient {
  return new MockSupabaseClient();
}

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

@Injectable()
export class SupabaseStorageService {
  private supabase: MockSupabaseClient;
  private config: SupabaseStorageConfigDto;

  constructor(config: SupabaseStorageConfigDto) {
    this.config = config;
    this.supabase = createClient(config.url, config.serviceKey);
  }

  async uploadProductImage(
    productId: string,
    file: MulterFile,
    metadata?: {
      alt?: string;
      caption?: string;
      tags?: string[];
    },
  ): Promise<UploadProductImageResponseDto> {
    try {
      // Generate unique filename
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Validate file type and size
      this.validateFile(file);

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.config.bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        throw new Error(`Supabase upload error: ${String(error)}`);
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.config.bucket)
        .getPublicUrl(fileName);

      // Store metadata in a separate table if needed
      if (metadata) {
        // await this.storeImageMetadata(fileName, metadata, productId);
      }

      return {
        success: true,
        imageUrl: publicUrl,
        metadata: {
          filename: fileName || '',
          size: file.size,
          format: fileExt || '',
          cdnUrl: publicUrl,
        },
      };
    } catch (error) {
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadMultipleProductImages(
    productId: string,
    files: MulterFile[],
    metadata?: {
      alt?: string;
      caption?: string;
      tags?: string[];
    },
  ): Promise<UploadProductImageResponseDto[]> {
    const uploadPromises = files.map(file => 
      this.uploadProductImage(productId, file, metadata)
    );

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      throw new Error(`Failed to upload multiple images: ${error.message}`);
    }
  }

  async deleteProductImage(imagePath: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase.storage
        .from(this.config.bucket)
        .remove([imagePath]);

      if (error) {
        throw new Error(`Supabase delete error: ${String(error)}`);
      }

      // Remove metadata if exists
      // await this.removeImageMetadata(imagePath);

      return {
        success: true,
        message: 'Product image deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getImageUrl(imagePath: string): Promise<string> {
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.config.bucket)
      .getPublicUrl(imagePath);

    return publicUrl;
  }

  private validateFile(file: MulterFile): void {
    // Check file size
    if (this.config.maxSize && file.size > this.config.maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.config.maxSize} bytes`);
    }

    // Check file type
    const fileExt = file.originalname.split('.').pop()?.toLowerCase();
    if (this.config.allowedTypes && fileExt && !this.config.allowedTypes.includes(fileExt)) {
      throw new Error(`File type ${fileExt} is not allowed. Allowed types: ${this.config.allowedTypes.join(', ')}`);
    }
  }

  private async storeImageMetadata(
    fileName: string,
    metadata: {
      alt?: string;
      caption?: string;
      tags?: string[];
    },
    productId: string,
  ): Promise<void> {
    // TODO: Store metadata in a separate table if needed
    // This could be a product_images table with metadata
    console.log('Storing metadata for:', fileName, metadata, productId);
  }

  private async removeImageMetadata(imagePath: string): Promise<void> {
    // TODO: Remove metadata from the product_images table
    console.log('Removing metadata for:', imagePath);
  }
}
