import { Controller, Post, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AdsAdminAuthService } from './auth.service';
import { AdsAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { AdsAdminGuard } from '../guards/ads-admin.guard';
import { UpdateEmailDto } from '../../platform-user/dto/update-email.dto';

@Controller('ads-admin/auth')
export class AdsAdminAuthController {
  constructor(private readonly authService: AdsAdminAuthService) {}

  @Post('login')
  async login(@Body() loginDto: AdsAdminLoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('change-password')
  @UseGuards(AdsAdminGuard)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, changePasswordDto);
  }

  @Get('me')
  @UseGuards(AdsAdminGuard)
  async getMe(@Request() req) {
    return this.authService.validateUser(req.user.sub);
  }

  @Post('forgot-password/request-otp')
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Post('forgot-password/verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('forgot-password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Patch('email')
  @UseGuards(AdsAdminGuard)
  async updateEmail(@Request() req, @Body() dto: UpdateEmailDto) {
    return this.authService.updateEmail(req.user.sub, dto);
  }
}
