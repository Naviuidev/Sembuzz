import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MasterAdminAuthModule } from '../auth/auth.module';
import { PendingUsersModule } from '../../school-admin/pending-users/pending-users.module';
import { SchoolAdminStudentsModule } from '../../school-admin/students/students.module';
import { SchoolAdminUserHelpModule } from '../../school-admin/user-help/school-admin-user-help.module';
import { MasterAdminUsersController } from './master-admin-users.controller';
import { MasterAdminUsersService } from './master-admin-users.service';

@Module({
  imports: [
    PrismaModule,
    MasterAdminAuthModule,
    PendingUsersModule,
    SchoolAdminStudentsModule,
    SchoolAdminUserHelpModule,
  ],
  controllers: [MasterAdminUsersController],
  providers: [MasterAdminUsersService],
})
export class MasterAdminUsersModule {}
