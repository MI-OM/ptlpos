import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly appName: string;
  private readonly mailgunDomain: string;
  private readonly mailgunApiKey: string;
  private readonly mailgunBaseUrl: string;
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('MAILGUN_FROM_EMAIL') || '';
    this.appName = this.configService.get<string>('APP_NAME') || 'PTLPOS';
    this.mailgunDomain = this.configService.get<string>('MAILGUN_DOMAIN') || '';
    this.mailgunApiKey = this.configService.get<string>('MAILGUN_API_KEY') || '';
    this.mailgunBaseUrl = (this.configService.get<string>('MAILGUN_BASE_URL') || 'https://api.mailgun.net/v3').replace(/\/$/, '');

    this.isConfigured = !!(this.mailgunDomain && this.mailgunApiKey && this.fromEmail);

    if (this.isConfigured) {
      this.logger.log('Email service initialized with Mailgun API');
    } else {
      this.logger.warn(
        'Mailgun credentials not configured, email sending disabled',
      );
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('Email service not configured, skipping email send');
      return false;
    }

    try {
      const endpoint = `${this.mailgunBaseUrl}/${this.mailgunDomain}/messages`;
      
      const form = new URLSearchParams();
      form.append('from', `${this.appName} <${this.fromEmail}>`);
      form.append('to', Array.isArray(options.to) ? options.to.join(',') : options.to);
      form.append('subject', options.subject);
      form.append('html', options.html);
      if (options.text) {
        form.append('text', options.text);
      }
      if (options.replyTo) {
        form.append('h:Reply-To', options.replyTo);
      }
      form.append('o:tracking', 'yes');
      form.append('o:tracking-clicks', 'no');
      form.append('o:tracking-opens', 'no');

      const response = await axios.post(endpoint, form.toString(), {
        auth: {
          username: 'api',
          password: this.mailgunApiKey,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      });

      const messageId = response.data?.id;
      if (messageId) {
        this.logger.log(
          `Email sent successfully to ${Array.isArray(options.to) ? options.to.join(', ') : options.to} (ID: ${messageId})`,
        );
        return true;
      } else {
        this.logger.error('No message ID received from Mailgun');
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error && typeof error === 'object' && 'response' in error 
        ? JSON.stringify((error as any).response?.data || {})
        : '';
      
      this.logger.error(
        `Failed to send email to ${options.to}: ${errorMessage}`,
        errorDetails,
      );
      return false;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
    resetUrl: string,
  ): Promise<boolean> {
    const html = this.getPasswordResetTemplate(name, resetUrl, resetToken);

    return this.sendEmail({
      to: email,
      subject: `${this.appName} - Password Reset Request`,
      html,
      text: `Click here to reset your password: ${resetUrl}`,
    });
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    loginUrl: string,
  ): Promise<boolean> {
    const html = this.getWelcomeTemplate(name, loginUrl);

    return this.sendEmail({
      to: email,
      subject: `Welcome to ${this.appName}`,
      html,
      text: `Welcome to ${this.appName}. Click here to login: ${loginUrl}`,
    });
  }

  async sendInvoiceEmail(
    email: string,
    invoiceNumber: string,
    invoiceHtml: string,
    attachmentBuffer?: Buffer,
  ): Promise<boolean> {
    const html = this.getInvoiceTemplate(invoiceNumber, invoiceHtml);

    return this.sendEmail({
      to: email,
      subject: `${this.appName} - Invoice #${invoiceNumber}`,
      html,
      text: `Invoice #${invoiceNumber} from ${this.appName}`,
    });
  }

  async sendReceiptEmail(
    email: string,
    receiptNumber: string,
    receiptHtml: string,
  ): Promise<boolean> {
    const html = this.getReceiptTemplate(receiptNumber, receiptHtml);

    return this.sendEmail({
      to: email,
      subject: `${this.appName} - Receipt #${receiptNumber}`,
      html,
      text: `Receipt #${receiptNumber} from ${this.appName}`,
    });
  }

  private getPasswordResetTemplate(
    name: string,
    resetUrl: string,
    resetToken: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f5f5f5; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${this.appName}</h2>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>You have requested to reset your password. Click the button below to set a new password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
              <p><strong>Security Note:</strong> This link will expire in 24 hours. If you didn't request this, please ignore this email.</p>
              <p>If you're having trouble, you can also use this code: <code>${resetToken}</code></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getWelcomeTemplate(name: string, loginUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; padding: 20px; text-align: center; color: white; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Welcome to ${this.appName}</h2>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Welcome to ${this.appName}! Your account has been created successfully.</p>
              <p>Click the button below to login and get started:</p>
              <a href="${loginUrl}" class="button">Login to Your Account</a>
              <p>Or visit: <a href="${loginUrl}">${loginUrl}</a></p>
              <p>If you have any questions, feel free to contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getInvoiceTemplate(invoiceNumber: string, invoiceHtml: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f5f5f5; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .invoice { border: 1px solid #ddd; padding: 20px; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${this.appName} - Invoice</h2>
            </div>
            <div class="content">
              <p>Dear Valued Customer,</p>
              <p>Please find your invoice #${invoiceNumber} below:</p>
              <div class="invoice">
                ${invoiceHtml}
              </div>
              <p>Thank you for your business!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getReceiptTemplate(receiptNumber: string, receiptHtml: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; padding: 20px; text-align: center; color: white; }
            .content { padding: 20px; }
            .receipt { border: 1px solid #ddd; padding: 20px; background-color: #f9f9f9; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${this.appName} - Receipt</h2>
            </div>
            <div class="content">
              <p>Thank you for your purchase!</p>
              <p>Your receipt #${receiptNumber} is below:</p>
              <div class="receipt">
                ${receiptHtml}
              </div>
              <p>We appreciate your business!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}
