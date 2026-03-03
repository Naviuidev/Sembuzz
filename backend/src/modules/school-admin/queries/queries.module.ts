import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { QueriesController } from './queries.controller';
import { QueriesService } from './queries.service';
import { SchoolsModule } from '../../super-admin/schools/schools.module';

@Module({
  imports: [
    ConfigModule,
    SchoolsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [QueriesController],
  providers: [QueriesService],
  exports: [QueriesService],
})
export class QueriesModule {}
