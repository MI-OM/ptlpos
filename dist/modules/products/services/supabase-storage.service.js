"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStorageService = void 0;
const common_1 = require("@nestjs/common");
const supabase_storage_config_dto_1 = require("../dto/supabase-storage-config.dto");
class MockSupabaseClient {
    storage = {
        from: (bucket) => ({
            upload: async (path, file, options) => ({ data: { path: 'mock-path' }, error: null }),
            getPublicUrl: (path) => ({ data: { publicUrl: 'mock-url' } }),
            remove: async (path) => ({ data: {}, error: null }),
        }),
    };
}
function createClient(url, key) {
    return new MockSupabaseClient();
}
let SupabaseStorageService = class SupabaseStorageService {
    supabase;
    config;
    constructor(config) {
        this.config = config;
        this.supabase = createClient(config.url, config.serviceKey);
    }
    async uploadProductImage(productId, file, metadata) {
        try {
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            this.validateFile(file);
            const { data, error } = await this.supabase.storage
                .from(this.config.bucket)
                .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });
            if (error) {
                throw new Error(`Supabase upload error: ${String(error)}`);
            }
            const { data: { publicUrl } } = this.supabase.storage
                .from(this.config.bucket)
                .getPublicUrl(fileName);
            if (metadata) {
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
        }
        catch (error) {
            throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async uploadMultipleProductImages(productId, files, metadata) {
        const uploadPromises = files.map(file => this.uploadProductImage(productId, file, metadata));
        try {
            const results = await Promise.all(uploadPromises);
            return results;
        }
        catch (error) {
            throw new Error(`Failed to upload multiple images: ${error.message}`);
        }
    }
    async deleteProductImage(imagePath) {
        try {
            const { error } = await this.supabase.storage
                .from(this.config.bucket)
                .remove([imagePath]);
            if (error) {
                throw new Error(`Supabase delete error: ${String(error)}`);
            }
            return {
                success: true,
                message: 'Product image deleted successfully',
            };
        }
        catch (error) {
            throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getImageUrl(imagePath) {
        const { data: { publicUrl } } = this.supabase.storage
            .from(this.config.bucket)
            .getPublicUrl(imagePath);
        return publicUrl;
    }
    validateFile(file) {
        if (this.config.maxSize && file.size > this.config.maxSize) {
            throw new Error(`File size exceeds maximum allowed size of ${this.config.maxSize} bytes`);
        }
        const fileExt = file.originalname.split('.').pop()?.toLowerCase();
        if (this.config.allowedTypes && fileExt && !this.config.allowedTypes.includes(fileExt)) {
            throw new Error(`File type ${fileExt} is not allowed. Allowed types: ${this.config.allowedTypes.join(', ')}`);
        }
    }
    async storeImageMetadata(fileName, metadata, productId) {
        console.log('Storing metadata for:', fileName, metadata, productId);
    }
    async removeImageMetadata(imagePath) {
        console.log('Removing metadata for:', imagePath);
    }
};
exports.SupabaseStorageService = SupabaseStorageService;
exports.SupabaseStorageService = SupabaseStorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_storage_config_dto_1.SupabaseStorageConfigDto])
], SupabaseStorageService);
//# sourceMappingURL=supabase-storage.service.js.map