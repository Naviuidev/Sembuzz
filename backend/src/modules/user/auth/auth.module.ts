import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { UserAuthController } from './auth.controller';
import { UserAuthService } from './auth.service';
import { UserGuard } from '../guards/user.guard';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    SchoolsModule,
    MulterModule.register({}), // required for FileInterceptor upload routes
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [UserAuthController],
  providers: [UserAuthService, UserGuard],
  exports: [UserAuthService, UserGuard, JwtModule],
})
export class UserAuthModule {}
