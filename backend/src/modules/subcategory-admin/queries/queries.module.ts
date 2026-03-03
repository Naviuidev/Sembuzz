import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { SubCategoryAdminQueriesController } from './queries.controller';
import { SubCategoryAdminQueriesService } from './queries.service';

@Module({
  imports: [
    ConfigModule,
    SchoolsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SubCategoryAdminQueriesController],
  providers: [SubCategoryAdminQueriesService],
  exports: [SubCategoryAdminQueriesService],
})
export class SubCategoryAdminQueriesModule {}
