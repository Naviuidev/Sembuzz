import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { FeaturesService } from '../features/features.service';
import { FeaturesController } from '../features/features.controller';
import { EmailService } from './email.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolsController, FeaturesController],
  providers: [SchoolsService, FeaturesService, EmailService],
  exports: [SchoolsService, FeaturesService, EmailService],
})
export class SchoolsModule {}
