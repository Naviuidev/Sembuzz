import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { CategoryAdminsController } from './category-admins.controller';
import { CategoryAdminsService } from './category-admins.service';
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
  controllers: [CategoryAdminsController],
  providers: [CategoryAdminsService],
  exports: [CategoryAdminsService],
})
export class CategoryAdminsModule {}
