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
export declare class UploadProductImageDto {
    file?: MulterFile;
    metadata?: {
        alt?: string;
        caption?: string;
        tags?: string[];
    };
    config?: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        format?: string[];
        maxSize?: number;
    };
}
export {};
