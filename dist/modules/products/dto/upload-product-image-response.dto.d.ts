export declare class UploadProductImageResponseDto {
    success: boolean;
    imageUrl: string;
    metadata?: {
        filename: string;
        size: number;
        format: string;
        cdnUrl: string;
    };
}
