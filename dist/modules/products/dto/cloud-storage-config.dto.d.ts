export declare enum CloudStorageProvider {
    AWS_S3 = "AWS_S3",
    GOOGLE_CLOUD = "GOOGLE_CLOUD",
    AZURE_BLOB = "AZURE_BLOB",
    DIGITAL_OCEAN = "DIGITAL_OCEAN"
}
export declare class CloudStorageConfigDto {
    provider?: CloudStorageProvider;
    config?: {
        bucket?: string;
        region?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        projectId?: string;
        connectionString?: string;
    };
    cdnBaseUrl?: string;
}
