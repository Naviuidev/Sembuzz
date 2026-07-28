import { Controller, Post, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { CategoryAdminAuthService } from './auth.service';
import { CategoryAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { CategoryAdminGuard } from '../guards/category-admin.guard';
import { UpdateEmailDto } from '../../platform-user/dto/update-email.dto';

@Controller('category-admin/auth')
export class CategoryAdminAuthController {
  constructor(private readonly authService: CategoryAdminAuthService) {}

  @Post('login')
  async login(@Body() loginDto: CategoryAdminLoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('change-password')
  @UseGuards(CategoryAdminGuard)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, changePasswordDto);
  }

  @Get('me')
  @UseGuards(CategoryAdminGuard)
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
  @UseGuards(CategoryAdminGuard)
  async updateEmail(@Request() req, @Body() dto: UpdateEmailDto) {
    return this.authService.updateEmail(req.user.sub, dto);
  }
}
