import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { SubCategoryAdminAuthService } from './auth.service';
import { SubCategoryAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';

@Controller('subcategory-admin/auth')
export class SubCategoryAdminAuthController {
  constructor(private readonly authService: SubCategoryAdminAuthService) {}

  @Post('login')
  async login(@Body() loginDto: SubCategoryAdminLoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('change-password')
  @UseGuards(SubCategoryAdminGuard)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, changePasswordDto);
  }

  @Get('me')
  @UseGuards(SubCategoryAdminGuard)
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
}
