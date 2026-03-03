import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { PendingUsersController } from './pending-users.controller';
import { PendingUsersService } from './pending-users.service';

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
  controllers: [PendingUsersController],
  providers: [PendingUsersService, SchoolAdminGuard],
  exports: [PendingUsersService],
})
export class PendingUsersModule {}
