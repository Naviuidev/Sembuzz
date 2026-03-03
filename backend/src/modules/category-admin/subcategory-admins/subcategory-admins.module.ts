import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SubCategoryAdminsController } from './subcategory-admins.controller';
import { SubCategoryAdminsService } from './subcategory-admins.service';
import { CategoryAdminGuard } from '../guards/category-admin.guard';
import { SchoolsModule } from '../../super-admin/schools/schools.module';

@Module({
  imports: [
    ConfigModule,
    SchoolsModule, // For EmailService
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SubCategoryAdminsController],
  providers: [SubCategoryAdminsService, CategoryAdminGuard],
  exports: [SubCategoryAdminsService],
})
export class SubCategoryAdminsModule {}
