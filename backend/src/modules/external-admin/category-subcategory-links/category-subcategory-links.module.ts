import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ExternalAdminGuard } from '../guards/external-admin.guard';
import { ExternalAdminCategorySubcategoryLinksController } from './category-subcategory-links.controller';
import { ExternalAdminCategorySubcategoryLinksService } from './category-subcategory-links.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ExternalAdminCategorySubcategoryLinksController],
  providers: [ExternalAdminCategorySubcategoryLinksService, ExternalAdminGuard],
})
export class ExternalAdminCategorySubcategoryLinksModule {}
