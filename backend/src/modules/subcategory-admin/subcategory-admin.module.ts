import { Module } from '@nestjs/common';
import { SubCategoryAdminAuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { SubCategoryAdminQueriesModule } from './queries/queries.module';

@Module({
  imports: [SubCategoryAdminAuthModule, EventsModule, SubCategoryAdminQueriesModule],
  exports: [SubCategoryAdminAuthModule],
})
export class SubCategoryAdminModule {}
