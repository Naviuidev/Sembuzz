import { Body, Controller, ForbiddenException, Get, Post, Request, UseGuards } from '@nestjs/common';
import { MasterAdminGuard } from '../guards/master-admin.guard';
import { MasterAdminLoginDto } from '../dto/login.dto';
import { SetMasterAdminPasswordDto } from '../dto/set-master-admin-password.dto';
import { MasterAdminJwtPayload } from '../types/master-admin-jwt.types';
import { MasterAdminAuthService } from './auth.service';

@Controller('master-admin/auth')
export class MasterAdminAuthController {
  constructor(private readonly authService: MasterAdminAuthService) {}

  @Post('login')
  login(@Body() loginDto: MasterAdminLoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(MasterAdminGuard)
  getMe(@Request() req: { user: MasterAdminJwtPayload }) {
    return this.authService.getProfile(req.user);
  }

  @Post('set-password')
  @UseGuards(MasterAdminGuard)
  setPassword(@Request() req: { user: MasterAdminJwtPayload }, @Body() body: SetMasterAdminPasswordDto) {
    if (req.user.role !== 'school_master_admin') {
      throw new ForbiddenException('Only school master admins use this flow');
    }
    return this.authService.setPassword(req.user.sub, body);
  }
}
