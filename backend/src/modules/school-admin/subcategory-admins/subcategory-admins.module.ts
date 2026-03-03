import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SchoolAdminSubcategoryAdminsController } from './subcategory-admins.controller';
import { SchoolAdminSubcategoryAdminsService } from './subcategory-admins.service';
import { SchoolAdminGuard } from '../guards/school-admin.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolAdminSubcategoryAdminsController],
  providers: [SchoolAdminSubcategoryAdminsService, SchoolAdminGuard],
  exports: [SchoolAdminSubcategoryAdminsService],
})
export class SchoolAdminSubcategoryAdminsModule {}
