import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailService } from '../super-admin/schools/email.service';
import { PlatformUserModule } from '../platform-user/platform-user.module';
import { SchoolAdminGuard } from '../school-admin/guards/school-admin.guard';
import { CategoryAdminGuard } from '../category-admin/guards/category-admin.guard';
import { AdminEmailChangeRequestsService } from './admin-email-change-requests.service';
import { SchoolAdminEmailChangeRequestsController } from './school-admin-email-change-requests.controller';
import { CategoryAdminEmailChangeRequestsController } from './category-admin-email-change-requests.controller';

@Module({
  imports: [
    PrismaModule,
    PlatformUserModule,
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolAdminEmailChangeRequestsController, CategoryAdminEmailChangeRequestsController],
  providers: [
    AdminEmailChangeRequestsService,
    EmailService,
    SchoolAdminGuard,
    CategoryAdminGuard,
  ],
  exports: [AdminEmailChangeRequestsService],
})
export class AdminEmailChangeRequestsModule {}
