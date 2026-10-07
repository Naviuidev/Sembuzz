import { Module } from '@nestjs/common';
import { ExternalAdminAuthModule } from './auth/auth.module';
import { ExternalAdminPipelineModule } from './pipeline/pipeline.module';
import { ExternalAdminPostRequestsModule } from './post-requests/post-requests.module';
import { ExternalAdminCategorySubcategoryLinksModule } from './category-subcategory-links/category-subcategory-links.module';

@Module({
  imports: [
    ExternalAdminAuthModule,
    ExternalAdminPipelineModule,
    ExternalAdminPostRequestsModule,
    ExternalAdminCategorySubcategoryLinksModule,
  ],
  exports: [ExternalAdminAuthModule],
})
export class ExternalAdminModule {}
