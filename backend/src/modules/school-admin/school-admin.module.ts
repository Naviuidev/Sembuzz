import { Module } from '@nestjs/common';
import { SchoolAdminAuthModule } from './auth/auth.module';
import { QueriesModule } from './queries/queries.module';
import { CategoriesModule } from './categories/categories.module';
import { CategoryAdminsModule } from './category-admins/category-admins.module';
import { PendingUsersModule } from './pending-users/pending-users.module';
import { SchoolAdminStudentsModule } from './students/students.module';
import { SchoolAdminPostsModule } from './posts/posts.module';
import { SchoolAdminSubcategoryAdminsModule } from './subcategory-admins/subcategory-admins.module';
import { SchoolAdminUserHelpModule } from './user-help/school-admin-user-help.module';
import { SchoolAdminSocialAccountsModule } from './social-accounts/school-admin-social-accounts.module';
import { UpcomingPostsModule } from './upcoming-posts/upcoming-posts.module';

@Module({
  imports: [
    SchoolAdminAuthModule,
    QueriesModule,
    CategoriesModule,
    CategoryAdminsModule,
    SchoolAdminSubcategoryAdminsModule,
    PendingUsersModule,
    SchoolAdminStudentsModule,
    SchoolAdminPostsModule,
    SchoolAdminUserHelpModule,
    SchoolAdminSocialAccountsModule,
    UpcomingPostsModule,
  ],
  exports: [
    SchoolAdminAuthModule,
    QueriesModule,
    CategoriesModule,
    CategoryAdminsModule,
    SchoolAdminSubcategoryAdminsModule,
    PendingUsersModule,
    SchoolAdminStudentsModule,
    SchoolAdminPostsModule,
    SchoolAdminUserHelpModule,
    SchoolAdminSocialAccountsModule,
    UpcomingPostsModule,
  ],
})
export class SchoolAdminModule {}
