import { Controller, Post, Get, Body, HttpCode, HttpStatus, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmailService } from '../email/email.service';
import { SupabaseStorageService } from '../products/services/supabase-storage.service';
import { SupabaseStorageConfigDto } from '../products/dto/supabase-storage-config.dto';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../core/decorators/public.decorator';

@ApiTags('Test')
@Controller('test')
export class TestController {
  private emailService: EmailService;
  private storageService: SupabaseStorageService | null = null;

  constructor(private configService: ConfigService) {
    this.emailService = new EmailService(configService);
    
    // Initialize Supabase storage if configured
    const supabaseConfig = this.getSupabaseConfig();
    if (supabaseConfig) {
      this.storageService = new SupabaseStorageService(supabaseConfig);
    }
  }

  private getSupabaseConfig(): SupabaseStorageConfigDto | null {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    const bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'product-images';

    if (url && serviceKey) {
      return {
        url,
        serviceKey,
        bucket,
        public: true,
        allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
        maxSize: 5242880, // 5MB
      };
    }

    return null;
  }

  @Post('email-welcome')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test welcome email',
    description: 'Tests the welcome email functionality that would be sent to new users'
  })
  @ApiResponse({
    status: 200,
    description: 'Welcome email test result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        emailService: { type: 'string' }
      }
    }
  })
  async testWelcomeEmail(@Body() body: { email: string; name?: string }) {
    const { email, name = 'Test User' } = body;

    try {
      const success = await this.emailService.sendWelcomeEmail(email, name, 'http://localhost:3000/login');
      
      return {
        success,
        message: success 
          ? 'Welcome email sent successfully' 
          : 'Failed to send welcome email',
        emailService: 'Mailgun API',
        recipient: email,
        testName: 'Welcome Email',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception occurred while sending welcome email',
        emailService: 'Mailgun API',
        error: error instanceof Error ? error.message : String(error),
        recipient: email,
        testName: 'Welcome Email',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('email-password-reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test password reset email',
    description: 'Tests the password reset email functionality'
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset email test result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async testPasswordResetEmail(@Body() body: { email: string; name?: string }) {
    const { email, name = 'Test User' } = body;
    const resetToken = 'test-reset-token-' + Date.now();
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

    try {
      const success = await this.emailService.sendPasswordResetEmail(email, name, resetToken, resetUrl);
      
      return {
        success,
        message: success 
          ? 'Password reset email sent successfully' 
          : 'Failed to send password reset email',
        emailService: 'Mailgun API',
        recipient: email,
        testName: 'Password Reset Email',
        resetUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception occurred while sending password reset email',
        emailService: 'Mailgun API',
        error: error instanceof Error ? error.message : String(error),
        recipient: email,
        testName: 'Password Reset Email',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('storage-upload')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Test Supabase storage upload',
    description: 'Tests uploading a file to Supabase storage'
  })
  @ApiResponse({
    status: 200,
    description: 'Storage upload test result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        imageUrl: { type: 'string' }
      }
    }
  })
  async testStorageUpload(@UploadedFile() file: any) {
    if (!file) {
      return {
        success: false,
        message: 'No file provided',
        storageService: 'Supabase Storage',
        timestamp: new Date().toISOString()
      };
    }

    if (!this.storageService) {
      return {
        success: false,
        message: 'Supabase storage not configured. Check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.',
        storageService: 'Supabase Storage',
        config: {
          url: this.configService.get<string>('SUPABASE_URL') ? 'SET' : 'NOT_SET',
          serviceKey: this.configService.get<string>('SUPABASE_SERVICE_KEY') ? 'SET' : 'NOT_SET',
          bucket: this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'product-images'
        },
        timestamp: new Date().toISOString()
      };
    }

    try {
      const productId = 'test-product-' + Date.now();
      const result = await this.storageService.uploadProductImage(productId, file);
      
      return {
        success: result.success,
        message: result.success ? 'File uploaded successfully' : 'Upload failed',
        storageService: 'Supabase Storage',
        imageUrl: result.imageUrl,
        metadata: result.metadata,
        productId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception occurred during file upload',
        storageService: 'Supabase Storage',
        error: error instanceof Error ? error.message : String(error),
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('services-status')
  @Public()
  @ApiOperation({
    summary: 'Check all external services status',
    description: 'Returns the status of email and storage services'
  })
  @ApiResponse({
    status: 200,
    description: 'Services status',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'object',
          properties: {
            configured: { type: 'boolean' },
            service: { type: 'string' }
          }
        },
        storage: {
          type: 'object',
          properties: {
            configured: { type: 'boolean' },
            service: { type: 'string' }
          }
        }
      }
    }
  })
  async getServicesStatus() {
    const emailConfigured = this.emailService.isEmailConfigured();
    const storageConfigured = !!this.getSupabaseConfig();

    return {
      email: {
        configured: emailConfigured,
        service: emailConfigured ? 'Mailgun API' : 'Not configured',
        environment: {
          mailgunDomain: process.env.MAILGUN_DOMAIN ? 'SET' : 'NOT_SET',
          mailgunApiKey: process.env.MAILGUN_API_KEY ? 'SET' : 'NOT_SET',
          mailgunFromEmail: process.env.MAILGUN_FROM_EMAIL ? 'SET' : 'NOT_SET'
        }
      },
      storage: {
        configured: storageConfigured,
        service: storageConfigured ? 'Supabase Storage' : 'Not configured',
        environment: {
          supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
          supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT_SET',
          supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET || 'product-images'
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  @Post('integration-test')
  @Public()
  @ApiOperation({
    summary: 'Full integration test',
    description: 'Tests both email and storage services together'
  })
  @ApiResponse({
    status: 200,
    description: 'Integration test results',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'object' },
        storage: { type: 'object' },
        overall: { type: 'object' }
      }
    }
  })
  async fullIntegrationTest(@Body() body: { email: string; name?: string }) {
    const { email, name = 'Test User' } = body;
    
    const results = {
      email: {
        welcome: { success: false, message: '', error: null as string | null },
        passwordReset: { success: false, message: '', error: null as string | null }
      },
      storage: {
        configured: !!this.storageService,
        message: this.storageService ? 'Available for testing' : 'Not configured'
      },
      overall: {
        allServicesWorking: false,
        summary: ''
      }
    };

    // Test welcome email
    try {
      const success = await this.emailService.sendWelcomeEmail(email, name, 'http://localhost:3000/login');
      results.email.welcome.success = success;
      results.email.welcome.message = success ? 'Welcome email sent' : 'Failed to send welcome email';
    } catch (error) {
      results.email.welcome.error = error instanceof Error ? error.message : String(error);
    }

    // Test password reset email
    try {
      const resetToken = 'test-token-' + Date.now();
      const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
      const success = await this.emailService.sendPasswordResetEmail(email, name, resetToken, resetUrl);
      results.email.passwordReset.success = success;
      results.email.passwordReset.message = success ? 'Password reset email sent' : 'Failed to send password reset email';
    } catch (error) {
      results.email.passwordReset.error = error instanceof Error ? error.message : String(error);
    }

    // Overall assessment
    const emailWorking = results.email.welcome.success || results.email.passwordReset.success;
    const storageWorking = results.storage.configured;
    
    results.overall.allServicesWorking = emailWorking && storageWorking;
    results.overall.summary = results.overall.allServicesWorking 
      ? 'All services are working correctly'
      : `Email: ${emailWorking ? '✅ Working' : '❌ Issues'}, Storage: ${storageWorking ? '✅ Configured' : '❌ Not configured'}`;

    return {
      ...results,
      timestamp: new Date().toISOString(),
      testEmail: email
    };
  }
}
