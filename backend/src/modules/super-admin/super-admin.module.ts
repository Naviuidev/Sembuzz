import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SchoolsModule } from './schools/schools.module';
import { SupportModule } from './support/support.module';
import { FeaturesService } from './features/features.service';

@Module({
  imports: [AuthModule, SchoolsModule, SupportModule],
  providers: [FeaturesService],
  exports: [FeaturesService],
})
export class SuperAdminModule {}
