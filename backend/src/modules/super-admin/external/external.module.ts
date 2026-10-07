import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ExternalController } from './external.controller';
import { ExternalService } from './external.service';
import { EmailService } from '../schools/email.service';
import { PlatformUserModule } from '../../platform-user/platform-user.module';

@Module({
  imports: [
    ConfigModule,
    PlatformUserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ExternalController],
  providers: [ExternalService, EmailService],
  exports: [ExternalService],
})
export class ExternalModule {}
