import { ConfigService } from '@nestjs/config';
export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
}
export declare class EmailService {
    private configService;
    private readonly logger;
    private readonly fromEmail;
    private readonly appName;
    private readonly mailgunDomain;
    private readonly mailgunApiKey;
    private readonly mailgunBaseUrl;
    private readonly isConfigured;
    constructor(configService: ConfigService);
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendPasswordResetEmail(email: string, name: string, resetToken: string, resetUrl: string): Promise<boolean>;
    sendVerificationEmail(email: string, name: string, verificationUrl: string): Promise<boolean>;
    sendWelcomeEmail(email: string, name: string, loginUrl: string): Promise<boolean>;
    sendInvoiceEmail(email: string, invoiceNumber: string, invoiceHtml: string, attachmentBuffer?: Buffer): Promise<boolean>;
    sendReceiptEmail(email: string, receiptNumber: string, receiptHtml: string): Promise<boolean>;
    private getPasswordResetTemplate;
    private getVerificationTemplate;
    private getWelcomeTemplate;
    private getInvoiceTemplate;
    private getReceiptTemplate;
    isEmailConfigured(): boolean;
}
