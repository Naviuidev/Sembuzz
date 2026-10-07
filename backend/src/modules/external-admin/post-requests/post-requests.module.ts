import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ExternalSchoolPostMessagesModule } from '../../external-school-post-messages/post-request-messages.module';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { ExternalAdminGuard } from '../guards/external-admin.guard';
import { ExternalAdminPostRequestsController } from './post-requests.controller';
import { ExternalAdminPostRequestsService } from './post-requests.service';

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
  controllers: [ExternalAdminPostRequestsController],
  providers: [ExternalAdminPostRequestsService, ExternalAdminGuard],
})
export class ExternalAdminPostRequestsModule {}
