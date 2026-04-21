import { Body, Controller, Get, Post, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { AuthContext } from '../../core/types/request-context';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginDiscoveryDto } from './dto/login-discovery.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import {
  RequestEmailVerificationDto,
  VerifyEmailDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/email-verification.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register new organization and create admin user',
    description:
      'Create a new tenant (organization) and the first admin user. No authentication required.',
  })
  @ApiResponse({
    status: 201,
    description: 'Organization and user successfully created',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        tenant: {
          id: 'clh7x1q0a0000qa10f0f0f0f0',
          name: 'Acme Corporation',
        },
        user: {
          userId: 'clh7x1q0b0000qa20f0f0f0f0',
          tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
          role: 'ADMIN',
          name: 'John Doe',
          email: 'john@acme.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or organization already exists',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'User login with tenant ID',
    description: 'Authenticate user with email, password, and tenant ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          userId: 'clh7x1q0b0000qa20f0f0f0f0',
          tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
          role: 'ADMIN',
          name: 'John Doe',
          email: 'john@acme.com',
        },
        tenant: {
          id: 'clh7x1q0a0000qa10f0f0f0f0',
          name: 'Acme Corporation',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('login/email')
  @ApiOperation({
    summary: 'User login with email only (automatic tenant discovery)',
    description: 'Authenticate user with just email and password. System will automatically discover the tenant.',
  })
  @ApiResponse({
    status: 201,
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          userId: 'clh7x1q0b0000qa20f0f0f0',
          tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
          role: 'ADMIN',
          name: 'John Doe',
          email: 'john@acme.com',
        },
        tenant: {
          id: 'clh7x1q0a0000qa10f0f0f0f0',
          name: 'Acme Corporation',
        },
      },
    },
  })
  @Public()
  @Post('login/email')
  @ApiOperation({
    summary: 'User login with email only (automatic tenant discovery)',
    description: 'Authenticate user with just email and password. System will automatically discover the tenant.',
  })
  @ApiResponse({
    status: 201,
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          userId: 'clh7x1q0b0000qa20f0f0f0',
          tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
          role: 'ADMIN',
          name: 'John Doe',
          email: 'john@acme.com',
        },
        tenant: {
          id: 'clh7x1q0a0000qa10f0f0f0f0',
          name: 'Acme Corporation',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async loginWithEmail(@Body() dto: LoginEmailDto) {
    return this.authService.loginWithEmail(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Use a refresh token to get a new pair of access and refresh tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'New tokens issued',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          userId: 'clh7x1q0b0000qa20f0f0f0f0',
          tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
          role: 'ADMIN',
          name: 'John Doe',
          email: 'john@acme.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve authenticated user information. Requires valid JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    schema: {
      example: {
        id: 'clh7x1q0b0000qa20f0f0f0f0',
        name: 'John Doe',
        email: 'john@acme.com',
        tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
        role: {
          name: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid token',
  })
  me(@CurrentUser() user: AuthContext) {
    return this.authService.me(user);
  }

  @Public()
  @Post('email/verify-request')
  @ApiOperation({
    summary: 'Request email verification token',
    description: 'Send a verification token to the organization email. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification token sent',
    schema: {
      example: {
        message: 'Verification token sent. Check your email.',
        email: 'contact@acme.com',
        token: 'abc123def456...',
        expiresAt: '2025-12-02T12:00:00Z',
      },
    },
  })
  requestEmailVerification(
    @Body() dto: RequestEmailVerificationDto,
    @CurrentUser() user: AuthContext
  ) {
    return this.authService.requestEmailVerification(user.tenantId, dto.email);
  }

  @Public()
  @Post('email/verify')
  @ApiOperation({
    summary: 'Verify email with token',
    description: 'Confirm email ownership using the verification token received via email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      example: {
        message: 'Email verified successfully',
        email: 'contact@acme.com',
        tenant: {
          id: 'clh7x1q0a0000qa10f0f0f0f0',
          name: 'Acme Corporation',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification token',
  })
  verifyEmail(@Body() dto: VerifyEmailDto, @CurrentUser() user: AuthContext) {
    return this.authService.verifyEmail(user.tenantId, dto.token);
  }

  @Public()
  @Post('password/reset-request')
  @ApiOperation({
    summary: 'Request password reset token',
    description: 'Send a password reset token to user email. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Password reset token sent (for security, same message for existing and non-existing emails)',
    schema: {
      example: {
        message: 'If the email exists, a password reset link has been sent',
        email: 'john@example.com',
        token: 'xyz789abc123...',
        expiresAt: '2025-12-01T13:00:00Z',
      },
    },
  })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.tenantId, dto.email);
  }

  @Public()
  @Post('password/reset')
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Set a new password using the reset token received via email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      example: {
        message: 'Password reset successfully',
        user: {
          id: 'clh7x1q0b0000qa20f0f0f0f0',
          email: 'john@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
