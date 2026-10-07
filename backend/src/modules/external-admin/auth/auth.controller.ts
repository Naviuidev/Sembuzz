import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ChangePasswordDto } from '../../school-admin/dto/change-password.dto';
import { ExternalAdminGuard } from '../guards/external-admin.guard';
import { ExternalAdminLoginDto } from '../dto/login.dto';
import { ExternalAdminAuthService } from './auth.service';

@Controller('external-admin/auth')
export class ExternalAdminAuthController {
  constructor(private readonly authService: ExternalAdminAuthService) {}

  @Post('login')
  login(@Body() loginDto: ExternalAdminLoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('change-password')
  @UseGuards(ExternalAdminGuard)
  changePassword(@Request() req: { user: { sub: string } }, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto);
  }

  @Get('me')
  @UseGuards(ExternalAdminGuard)
  getMe(@Request() req: { user: { sub: string } }) {
    return this.authService.validateUser(req.user.sub);
  }
}
