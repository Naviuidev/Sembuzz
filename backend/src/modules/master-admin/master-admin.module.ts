import { Module } from '@nestjs/common';
import { MasterAdminAuthModule } from './auth/auth.module';
import { MasterAdminSchoolsModule } from './schools/schools.module';
import { MasterAdminPostsModule } from './posts/posts.module';
import { MasterAdminSocialAccountsModule } from './social-accounts/master-admin-social-accounts.module';
import { MasterAdminUsersModule } from './users/master-admin-users.module';
import { MasterAdminCategoriesModule } from './categories/master-admin-categories.module';
import { MasterAdminExternalConfigModule } from './external-config/master-admin-external-config.module';
import { MasterAdminQueriesModule } from './queries/master-admin-queries.module';
import { MasterAdminBlogsModule } from './blogs/master-admin-blogs.module';
import { MasterAdminDashboardModule } from './dashboard/master-admin-dashboard.module';
import { MasterAdminDeveloperLayerModule } from './developer-layer/master-admin-developer-layer.module';

@Module({
  imports: [
    MasterAdminAuthModule,
    MasterAdminDashboardModule,
    MasterAdminDeveloperLayerModule,
    MasterAdminSchoolsModule,
    MasterAdminPostsModule,
    MasterAdminBlogsModule,
    MasterAdminSocialAccountsModule,
    MasterAdminUsersModule,
    MasterAdminCategoriesModule,
    MasterAdminExternalConfigModule,
    MasterAdminQueriesModule,
  ],
  exports: [MasterAdminAuthModule],
})
export class MasterAdminModule {}
