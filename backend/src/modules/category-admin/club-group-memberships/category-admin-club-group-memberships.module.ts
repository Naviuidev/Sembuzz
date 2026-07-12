import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { CategoryAdminClubGroupMembershipsController } from './category-admin-club-group-memberships.controller';
import { CategoryAdminClubGroupMembershipsService } from './category-admin-club-group-memberships.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    SchoolsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [CategoryAdminClubGroupMembershipsController],
  providers: [CategoryAdminClubGroupMembershipsService],
})
export class CategoryAdminClubGroupMembershipsModule {}
