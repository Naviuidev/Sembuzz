import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      const superAdmin = await this.prisma.superAdmin.findUnique({
        where: { email },
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
        email: superAdmin.email,
        role: 'super_admin',
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
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

  async validateUser(userId: string) {
    try {
      const superAdmin = await this.prisma.superAdmin.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      if (!superAdmin) {
        throw new UnauthorizedException('User not found');
      }

      return superAdmin;
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
