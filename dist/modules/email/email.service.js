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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    fromEmail;
    appName;
    mailgunDomain;
    mailgunApiKey;
    mailgunBaseUrl;
    isConfigured;
    constructor(configService) {
        this.configService = configService;
        this.fromEmail = this.configService.get('MAILGUN_FROM_EMAIL') || '';
        this.appName = this.configService.get('APP_NAME') || 'PTLPOS';
        this.mailgunDomain = this.configService.get('MAILGUN_DOMAIN') || '';
        this.mailgunApiKey = this.configService.get('MAILGUN_API_KEY') || '';
        this.mailgunBaseUrl = (this.configService.get('MAILGUN_BASE_URL') || 'https://api.mailgun.net/v3').replace(/\/$/, '');
        this.isConfigured = !!(this.mailgunDomain && this.mailgunApiKey && this.fromEmail);
        if (this.isConfigured) {
            this.logger.log('Email service initialized with Mailgun API');
        }
        else {
            this.logger.warn('Mailgun credentials not configured, email sending disabled');
        }
    }
    async sendEmail(options) {
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
            const response = await axios_1.default.post(endpoint, form.toString(), {
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
                this.logger.log(`Email sent successfully to ${Array.isArray(options.to) ? options.to.join(', ') : options.to} (ID: ${messageId})`);
                return true;
            }
            else {
                this.logger.error('No message ID received from Mailgun');
                return false;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error && typeof error === 'object' && 'response' in error
                ? JSON.stringify(error.response?.data || {})
                : '';
            this.logger.error(`Failed to send email to ${options.to}: ${errorMessage}`, errorDetails);
            return false;
        }
    }
    async sendPasswordResetEmail(email, name, resetToken, resetUrl) {
        const html = this.getPasswordResetTemplate(name, resetUrl, resetToken);
        return this.sendEmail({
            to: email,
            subject: `${this.appName} - Password Reset Request`,
            html,
            text: `Click here to reset your password: ${resetUrl}`,
        });
    }
    async sendVerificationEmail(email, name, verificationUrl) {
        const html = this.getVerificationTemplate(name, verificationUrl);
        return this.sendEmail({
            to: email,
            subject: `${this.appName} - Verify Your Email`,
            html,
            text: `Click here to verify your email: ${verificationUrl}`,
        });
    }
    async sendWelcomeEmail(email, name, loginUrl) {
        const html = this.getWelcomeTemplate(name, loginUrl);
        return this.sendEmail({
            to: email,
            subject: `Welcome to ${this.appName}`,
            html,
            text: `Welcome to ${this.appName}. Click here to login: ${loginUrl}`,
        });
    }
    async sendInvoiceEmail(email, invoiceNumber, invoiceHtml, attachmentBuffer) {
        const html = this.getInvoiceTemplate(invoiceNumber, invoiceHtml);
        return this.sendEmail({
            to: email,
            subject: `${this.appName} - Invoice #${invoiceNumber}`,
            html,
            text: `Invoice #${invoiceNumber} from ${this.appName}`,
        });
    }
    async sendReceiptEmail(email, receiptNumber, receiptHtml) {
        const html = this.getReceiptTemplate(receiptNumber, receiptHtml);
        return this.sendEmail({
            to: email,
            subject: `${this.appName} - Receipt #${receiptNumber}`,
            html,
            text: `Receipt #${receiptNumber} from ${this.appName}`,
        });
    }
    getPasswordResetTemplate(name, resetUrl, resetToken) {
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
    getVerificationTemplate(name, verificationUrl) {
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
              <h2>Verify Your Email</h2>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for creating an account with ${this.appName}! Please verify your email address by clicking the button below:</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
              <p>Or copy this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
              <p><strong>Note:</strong> This link will expire in 24 hours.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    getWelcomeTemplate(name, loginUrl) {
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
    getInvoiceTemplate(invoiceNumber, invoiceHtml) {
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
    getReceiptTemplate(receiptNumber, receiptHtml) {
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
    isEmailConfigured() {
        return this.isConfigured;
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map