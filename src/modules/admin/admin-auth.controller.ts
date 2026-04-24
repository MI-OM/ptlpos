import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../../core/guards/admin-jwt-auth.guard';
import { Public } from '../../core/decorators/public.decorator';

@ApiTags('Admin Authentication')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new admin user' })
  @ApiResponse({ status: 201, description: 'Admin user registered successfully' })
  @ApiResponse({ status: 409, description: 'Admin user already exists' })
  async register(@Body() registerDto: AdminRegisterDto) {
    return this.adminAuthService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: AdminLoginDto) {
    return this.adminAuthService.login(loginDto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh admin access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.adminAuthService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    // In a real implementation, you might want to blacklist the token
    return { message: 'Logout successful' };
  }

  @Get('profile')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req: any) {
    const adminId = req.user.sub;
    return this.adminAuthService.validateAdminUser(adminId);
  }
}
