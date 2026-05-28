import { EmailService } from './email.service';
import { TestEmailDto } from './dto/test-email.dto';
export declare class EmailController {
    private readonly emailService;
    constructor(emailService: EmailService);
    sendTestEmail(testEmailDto: TestEmailDto): Promise<{
        success: boolean;
        message: string;
        emailConfigured: boolean;
        environment: {
            mailgunDomain: string;
            mailgunApiKey: string;
            mailgunFromEmail: string;
        };
        sentTo?: undefined;
        sentAt?: undefined;
        troubleshooting?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        emailConfigured: boolean;
        sentTo: string;
        sentAt: string;
        troubleshooting: {
            note: string;
            expectedDomain: string;
            expectedUser: string;
            smtpHost: string;
            smtpPort: number;
        };
        environment?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        emailConfigured: boolean;
        sentTo: string;
        sentAt: string;
        error: string;
        troubleshooting: {
            note: string;
            expectedDomain: string;
            expectedUser: string;
            smtpHost: string;
            smtpPort: number;
        };
        environment?: undefined;
    }>;
    getEmailStatus(): Promise<{
        configured: boolean;
        service: string;
        environment: {
            mailgunDomain: string;
            mailgunApiKey: string;
            mailgunFromEmail: string;
            appName: string;
        };
        diagnostics: {
            smtpHost: string;
            smtpPort: number;
            smtpUser: string;
            note: string;
        };
    }>;
}
