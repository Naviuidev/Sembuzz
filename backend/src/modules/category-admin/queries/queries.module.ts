import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { CategoryAdminQueriesController } from './queries.controller';
import { CategoryAdminQueriesService } from './queries.service';

@Module({
  imports: [
    ConfigModule,
    SchoolsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [CategoryAdminQueriesController],
  providers: [CategoryAdminQueriesService],
  exports: [CategoryAdminQueriesService],
})
export class CategoryAdminQueriesModule {}
