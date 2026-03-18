import { Module } from '@nestjs/common';
import { SubCategoryAdminAuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { SubCategoryAdminQueriesModule } from './queries/queries.module';
import { SubCategoryAdminBlogsModule } from './blogs/blogs.module';

@Module({
  imports: [
    SubCategoryAdminAuthModule,
    EventsModule,
    SubCategoryAdminQueriesModule,
    SubCategoryAdminBlogsModule,
  ],
  exports: [SubCategoryAdminAuthModule],
})
export class SubCategoryAdminModule {}
