import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { SchoolAdminAuthService } from './auth.service';
import { SchoolAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { SchoolAdminGuard } from '../guards/school-admin.guard';

@Controller('school-admin/auth')
export class SchoolAdminAuthController {
  constructor(private readonly authService: SchoolAdminAuthService) {}

  @Post('login')
  async login(@Body() loginDto: SchoolAdminLoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('change-password')
  @UseGuards(SchoolAdminGuard)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, changePasswordDto);
  }

  @Get('me')
  @UseGuards(SchoolAdminGuard)
  async getMe(@Request() req) {
    return this.authService.validateUser(req.user.sub);
  }

  @Post('forgot-password/request-otp')
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto);
  }

  @Post('forgot-password/verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('forgot-password/reset')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
