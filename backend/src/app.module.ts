import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsPublicController } from './events-public.controller';
import { GoogleAuthController } from './google-auth.controller';
import { PrismaModule } from './prisma/prisma.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { SchoolAdminModule } from './modules/school-admin/school-admin.module';
import { CategoryAdminModule } from './modules/category-admin/category-admin.module';
import { SubCategoryAdminModule } from './modules/subcategory-admin/subcategory-admin.module';
import { AdsAdminModule } from './modules/ads-admin/ads-admin.module';
import { UserModule } from './modules/user/user.module';
import { ContactModule } from './modules/contact/contact.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MeetingsModule,
    SuperAdminModule,
    SchoolAdminModule,
    CategoryAdminModule,
    SubCategoryAdminModule,
    AdsAdminModule,
    UserModule,
    ContactModule,
  ],
  controllers: [AppController, GoogleAuthController, EventsPublicController],
  providers: [AppService],
})
export class AppModule {}
