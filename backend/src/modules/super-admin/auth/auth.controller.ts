import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import { SuperAdminGuard } from '../guards/super-admin.guard';

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
}
