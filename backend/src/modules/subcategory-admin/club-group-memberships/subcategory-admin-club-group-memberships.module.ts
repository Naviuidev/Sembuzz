import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module';
import { EmailService } from '../../super-admin/schools/email.service';
import { SubCategoryAdminClubGroupMembershipsController } from './subcategory-admin-club-group-memberships.controller';
import { SubCategoryAdminClubGroupMembershipsService } from './subcategory-admin-club-group-memberships.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SubCategoryAdminClubGroupMembershipsController],
  providers: [SubCategoryAdminClubGroupMembershipsService, EmailService],
})
export class SubCategoryAdminClubGroupMembershipsModule {}
