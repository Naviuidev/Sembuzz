import { Controller, Post, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { UpdateEmailDto } from '../../platform-user/dto/update-email.dto';

@Controller('super-admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(SuperAdminGuard)
  async logout() {
    // JWT is stateless, so logout is handled client-side by removing token
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(SuperAdminGuard)
  async getMe(@Request() req) {
    return this.authService.validateUser(req.user.sub);
  }

  @Patch('email')
  @UseGuards(SuperAdminGuard)
  async updateEmail(@Request() req, @Body() dto: UpdateEmailDto) {
    return this.authService.updateEmail(req.user.sub, dto);
  }
}
