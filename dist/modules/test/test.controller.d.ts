import { ConfigService } from '@nestjs/config';
export declare class TestController {
    private configService;
    private emailService;
    private storageService;
    constructor(configService: ConfigService);
    private getSupabaseConfig;
    testWelcomeEmail(body: {
        email: string;
        name?: string;
    }): Promise<{
        success: boolean;
        message: string;
        emailService: string;
        recipient: string;
        testName: string;
        timestamp: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        emailService: string;
        error: string;
        recipient: string;
        testName: string;
        timestamp: string;
    }>;
    testPasswordResetEmail(body: {
        email: string;
        name?: string;
    }): Promise<{
        success: boolean;
        message: string;
        emailService: string;
        recipient: string;
        testName: string;
        resetUrl: string;
        timestamp: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        emailService: string;
        error: string;
        recipient: string;
        testName: string;
        timestamp: string;
        resetUrl?: undefined;
    }>;
    testStorageUpload(file: any): Promise<{
        success: boolean;
        message: string;
        storageService: string;
        timestamp: string;
        config?: undefined;
        imageUrl?: undefined;
        metadata?: undefined;
        productId?: undefined;
        fileName?: undefined;
        fileSize?: undefined;
        mimeType?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        storageService: string;
        config: {
            url: string;
            serviceKey: string;
            bucket: string;
        };
        timestamp: string;
        imageUrl?: undefined;
        metadata?: undefined;
        productId?: undefined;
        fileName?: undefined;
        fileSize?: undefined;
        mimeType?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        storageService: string;
        imageUrl: string;
        metadata: {
            filename: string;
            size: number;
            format: string;
            cdnUrl: string;
        };
        productId: string;
        fileName: any;
        fileSize: any;
        mimeType: any;
        timestamp: string;
        config?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        storageService: string;
        error: string;
        fileName: any;
        fileSize: any;
        mimeType: any;
        timestamp: string;
        config?: undefined;
        imageUrl?: undefined;
        metadata?: undefined;
        productId?: undefined;
    }>;
    getServicesStatus(): Promise<{
        email: {
            configured: boolean;
            service: string;
            environment: {
                mailgunDomain: string;
                mailgunApiKey: string;
                mailgunFromEmail: string;
            };
        };
        storage: {
            configured: boolean;
            service: string;
            environment: {
                supabaseUrl: string;
                supabaseServiceKey: string;
                supabaseBucket: string;
            };
        };
        timestamp: string;
    }>;
    fullIntegrationTest(body: {
        email: string;
        name?: string;
    }): Promise<{
        timestamp: string;
        testEmail: string;
        email: {
            welcome: {
                success: boolean;
                message: string;
                error: string | null;
            };
            passwordReset: {
                success: boolean;
                message: string;
                error: string | null;
            };
        };
        storage: {
            configured: boolean;
            message: string;
        };
        overall: {
            allServicesWorking: boolean;
            summary: string;
        };
    }>;
}
