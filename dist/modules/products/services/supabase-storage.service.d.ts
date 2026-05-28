import { SupabaseStorageConfigDto } from '../dto/supabase-storage-config.dto';
import { UploadProductImageResponseDto } from '../dto/upload-product-image-response.dto';
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
export declare class SupabaseStorageService {
    private supabase;
    private config;
    constructor(config: SupabaseStorageConfigDto);
    uploadProductImage(productId: string, file: MulterFile, metadata?: {
        alt?: string;
        caption?: string;
        tags?: string[];
    }): Promise<UploadProductImageResponseDto>;
    uploadMultipleProductImages(productId: string, files: MulterFile[], metadata?: {
        alt?: string;
        caption?: string;
        tags?: string[];
    }): Promise<UploadProductImageResponseDto[]>;
    deleteProductImage(imagePath: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getImageUrl(imagePath: string): Promise<string>;
    private validateFile;
    private storeImageMetadata;
    private removeImageMetadata;
}
export {};
