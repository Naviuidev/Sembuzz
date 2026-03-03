import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SchoolsModule } from '../schools/schools.module';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [
    SchoolsModule,
    PrismaModule,
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
