import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { SubCategoryAdminExternalConfigController } from './external-config.controller';
import { SubCategoryAdminExternalConfigService } from './external-config.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SubCategoryAdminExternalConfigController],
  providers: [SubCategoryAdminExternalConfigService, SubCategoryAdminGuard],
})
export class SubCategoryAdminExternalConfigModule {}
