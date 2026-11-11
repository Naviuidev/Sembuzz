import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MasterAdminAuthModule } from '../auth/auth.module';
import { MasterAdminSocialAccountsController } from './master-admin-social-accounts.controller';
import { MasterAdminSocialAccountsService } from './master-admin-social-accounts.service';

@Module({
  imports: [PrismaModule, MasterAdminAuthModule],
  controllers: [MasterAdminSocialAccountsController],
  providers: [MasterAdminSocialAccountsService],
})
export class MasterAdminSocialAccountsModule {}
