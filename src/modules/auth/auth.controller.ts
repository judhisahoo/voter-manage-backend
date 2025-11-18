// src/modules/auth/auth.controller.ts
import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../auth/decorators/public.decorator'; //'./decorators/public.decorator';
import { EmailService } from '../email/email.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private emailService: EmailService, // Add this
  ) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Test email endpoint - Remove in production
  @Public()
  @Get('test-email')
  async testEmail(@Query('email') email: string) {
    try {
      const result = await this.emailService.sendTestEmail(email);
      return {
        success: true,
        message: 'Test email sent successfully',
        result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send test email',
        error: error.message,
      };
    }
  }

  // SMTP connection test endpoint
  @Public()
  @Get('test-smtp')
  async testSmtp() {
    try {
      const result = await this.emailService.testConnection();
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'SMTP connection test failed',
        error: error.message,
      };
    }
  }
}
