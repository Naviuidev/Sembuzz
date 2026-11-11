import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MasterAdminAuthModule } from '../auth/auth.module';
import { MasterAdminSchoolsController } from './schools.controller';
import { MasterAdminSchoolsService } from './schools.service';

@Module({
  imports: [PrismaModule, MasterAdminAuthModule],
  controllers: [MasterAdminSchoolsController],
  providers: [MasterAdminSchoolsService],
})
export class MasterAdminSchoolsModule {}
