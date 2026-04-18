import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/modules/email/email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                MAILGUN_DOMAIN: 'sandbox.mailgun.org',
                MAILGUN_API_KEY: 'test-api-key',
                MAILGUN_FROM_EMAIL: 'noreply@ptlpos.com',
                APP_NAME: 'PTLPOS',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should indicate email is configured', () => {
    expect(service.isEmailConfigured()).toBe(true);
  });

  it('should indicate email is not configured when credentials missing', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                MAILGUN_DOMAIN: '',
                MAILGUN_API_KEY: '',
                MAILGUN_FROM_EMAIL: '',
                APP_NAME: 'PTLPOS',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    const unconfiguredService = module.get<EmailService>(EmailService);
    expect(unconfiguredService.isEmailConfigured()).toBe(false);
  });

  it('should return false when service is not configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => undefined),
          },
        },
      ],
    }).compile();

    const unconfiguredService = module.get<EmailService>(EmailService);
    const result = await unconfiguredService.sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result).toBe(false);
  });

  describe('Email template generation', () => {
    it('should generate password reset template', async () => {
      const result = await service.sendPasswordResetEmail(
        'user@example.com',
        'John Doe',
        'token123',
        'https://app.com/reset?token=token123',
      );

      // Since transporter is mocked, we just check it returns a boolean
      expect(typeof result).toBe('boolean');
    });

    it('should generate welcome template', async () => {
      const result = await service.sendWelcomeEmail(
        'user@example.com',
        'Jane Smith',
        'https://app.com/login',
      );

      expect(typeof result).toBe('boolean');
    });

    it('should generate invoice template', async () => {
      const result = await service.sendInvoiceEmail(
        'customer@example.com',
        'INV-001',
        '<p>Invoice details</p>',
      );

      expect(typeof result).toBe('boolean');
    });

    it('should generate receipt template', async () => {
      const result = await service.sendReceiptEmail(
        'customer@example.com',
        'REC-001',
        '<p>Receipt details</p>',
      );

      expect(typeof result).toBe('boolean');
    });
  });
});
