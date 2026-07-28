import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformUserService } from '../../platform-user/platform-user.service';
import { UpdateEmailDto } from '../../platform-user/dto/update-email.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private platformUserService: PlatformUserService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      const platformUser = await this.platformUserService.findByEmail(email);
      if (!platformUser) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const superAdmin = await this.prisma.superAdmin.findUnique({
        where: { platformUserId: platformUser.id },
      });

      if (!superAdmin) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, superAdmin.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = {
        sub: superAdmin.id,
        userId: platformUser.id,
        email: platformUser.email,
        role: 'super_admin',
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: superAdmin.id,
          userId: platformUser.id,
          name: superAdmin.name,
          email: platformUser.email,
        },
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SuperAdmin Auth] login error:', message, err);
      throw new HttpException(
        { statusCode: 500, message: 'Internal server error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateEmail(adminId: string, dto: UpdateEmailDto) {
    const admin = await this.prisma.superAdmin.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new UnauthorizedException('User not found');
    }
    const updated = await this.platformUserService.updateEmail(admin.platformUserId, dto.email);
    return { userId: updated.id, email: updated.email };
  }

  async validateUser(userId: string) {
    try {
      const superAdmin = await this.prisma.superAdmin.findUnique({
        where: { id: userId },
        select: {
          id: true,
          platformUserId: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      if (!superAdmin) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: superAdmin.id,
        userId: superAdmin.platformUserId,
        name: superAdmin.name,
        email: superAdmin.email,
        createdAt: superAdmin.createdAt,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SuperAdmin Auth] validateUser error:', message, err);
      throw new HttpException(
        { statusCode: 500, message: 'Internal server error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
