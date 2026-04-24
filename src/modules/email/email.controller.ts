import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { TestEmailDto } from './dto/test-email.dto';
import { Public } from '../../core/decorators/public.decorator';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send test email',
    description: 'Sends a test email to verify Mailgun configuration is working'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Test email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Test email sent successfully' },
        emailConfigured: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid email address or email service not configured' 
  })
  async sendTestEmail(@Body() testEmailDto: TestEmailDto) {
    const isConfigured = this.emailService.isEmailConfigured();
    
    if (!isConfigured) {
      return {
        success: false,
        message: 'Email service is not configured. Please check your Mailgun settings.',
        emailConfigured: false,
        environment: {
          mailgunDomain: process.env.MAILGUN_DOMAIN ? 'SET' : 'NOT_SET',
          mailgunApiKey: process.env.MAILGUN_API_KEY ? 'SET' : 'NOT_SET',
          mailgunFromEmail: process.env.MAILGUN_FROM_EMAIL ? 'SET' : 'NOT_SET',
        }
      };
    }

    const customMessage = testEmailDto.message || 'This is a test email from PTLPOS to verify the email service is working correctly.';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; padding: 20px; text-align: center; color: white; }
            .content { padding: 20px; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
            .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>PTLPOS Email Test</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <div class="status success">
                <strong>✅ Email Service Test Successful!</strong>
              </div>
              <p>${customMessage}</p>
              <p><strong>Test Details:</strong></p>
              <ul>
                <li>Sent at: ${new Date().toISOString()}</li>
                <li>Service: Mailgun SMTP</li>
                <li>Application: PTLPOS</li>
              </ul>
              <p>If you received this email, your email configuration is working correctly!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} PTLPOS. All rights reserved.</p>
              <p>This is an automated test email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const success = await this.emailService.sendEmail({
        to: testEmailDto.to,
        subject: 'PTLPOS Email Service Test',
        html,
        text: `PTLPOS Email Test\n\n${customMessage}\n\nSent at: ${new Date().toISOString()}\nService: Mailgun SMTP\nApplication: PTLPOS\n\nIf you received this email, your email configuration is working correctly!`
      });

      return {
        success,
        message: success 
          ? 'Test email sent successfully' 
          : 'Failed to send test email. Check server logs for details.',
        emailConfigured: true,
        sentTo: testEmailDto.to,
        sentAt: new Date().toISOString(),
        troubleshooting: {
          note: 'If email failed, verify you are using the correct Mailgun SMTP API key (not the public API key)',
          expectedDomain: process.env.MAILGUN_DOMAIN,
          expectedUser: `postmaster@${process.env.MAILGUN_DOMAIN}`,
          smtpHost: 'smtp.mailgun.org',
          smtpPort: 587
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception occurred while sending email',
        emailConfigured: true,
        sentTo: testEmailDto.to,
        sentAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        troubleshooting: {
          note: 'Common issues: 1) Wrong API key (use SMTP key, not public key), 2) Domain not verified in Mailgun, 3) Firewall blocking SMTP',
          expectedDomain: process.env.MAILGUN_DOMAIN,
          expectedUser: `postmaster@${process.env.MAILGUN_DOMAIN}`,
          smtpHost: 'smtp.mailgun.org',
          smtpPort: 587
        }
      };
    }
  }

  @Get('status')
  @Public()
  @ApiOperation({ 
    summary: 'Check email service status',
    description: 'Returns the current configuration status of the email service'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email service status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        configured: { type: 'boolean', example: true },
        service: { type: 'string', example: 'Mailgun SMTP' },
        environment: {
          type: 'object',
          properties: {
            mailgunDomain: { type: 'string', example: 'SET' },
            mailgunApiKey: { type: 'string', example: 'SET' },
            mailgunFromEmail: { type: 'string', example: 'SET' }
          }
        }
      }
    }
  })
  async getEmailStatus() {
    const isConfigured = this.emailService.isEmailConfigured();
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunFromEmail = process.env.MAILGUN_FROM_EMAIL;
    
    return {
      configured: isConfigured,
      service: isConfigured ? 'Mailgun SMTP' : 'Not configured',
      environment: {
        mailgunDomain: mailgunDomain ? `SET (${mailgunDomain})` : 'NOT_SET',
        mailgunApiKey: mailgunApiKey ? `SET (${mailgunApiKey.substring(0, 8)}...)` : 'NOT_SET',
        mailgunFromEmail: mailgunFromEmail ? `SET (${mailgunFromEmail})` : 'NOT_SET',
        appName: process.env.APP_NAME || 'PTLPOS'
      },
      diagnostics: {
        smtpHost: mailgunDomain ? `smtp.mailgun.org` : 'NOT_CONFIGURED',
        smtpPort: 587,
        smtpUser: mailgunDomain ? `postmaster@${mailgunDomain}` : 'NOT_CONFIGURED',
        note: 'Make sure your Mailgun API key is the SMTP API key, not the public API key'
      }
    };
  }
}
