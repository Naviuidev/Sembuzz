import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ExternalSchoolPostMessagesModule } from '../../external-school-post-messages/post-request-messages.module';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { SchoolAdminExternalPostRequestsController } from './external-post-requests.controller';
import { SchoolAdminExternalPostRequestsService } from './external-post-requests.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    SchoolsModule,
    ExternalSchoolPostMessagesModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolAdminExternalPostRequestsController],
  providers: [SchoolAdminExternalPostRequestsService, SchoolAdminGuard],
})
export class SchoolAdminExternalPostRequestsModule {}
