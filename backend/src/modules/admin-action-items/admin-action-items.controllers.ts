import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { SchoolAdminGuard } from '../school-admin/guards/school-admin.guard';
import { CategoryAdminGuard } from '../category-admin/guards/category-admin.guard';
import { SubCategoryAdminGuard } from '../subcategory-admin/guards/subcategory-admin.guard';
import { SuperAdminGuard } from '../super-admin/guards/super-admin.guard';
import { AdsAdminGuard } from '../ads-admin/guards/ads-admin.guard';
import { AdminActionItemsService } from './admin-action-items.service';

@Controller('school-admin/action-items')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminActionItemsController {
  constructor(private readonly service: AdminActionItemsService) {}

  @Get()
  list(@Request() req: { user: { schoolId: string } }) {
    return this.service.forSchoolAdmin(req.user.schoolId);
  }
}

@Controller('category-admin/action-items')
@UseGuards(CategoryAdminGuard)
export class CategoryAdminActionItemsController {
  constructor(private readonly service: AdminActionItemsService) {}

  @Get()
  list(@Request() req: { user: { sub: string; schoolId: string } }) {
    return this.service.forCategoryAdmin(req.user.sub, req.user.schoolId);
  }
}

@Controller('subcategory-admin/action-items')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminActionItemsController {
  constructor(private readonly service: AdminActionItemsService) {}

  @Get()
  list(@Request() req: { user: { sub: string } }) {
    return this.service.forSubCategoryAdmin(req.user.sub);
  }
}

@Controller('super-admin/action-items')
@UseGuards(SuperAdminGuard)
export class SuperAdminActionItemsController {
  constructor(private readonly service: AdminActionItemsService) {}

  @Get()
  list() {
    return this.service.forSuperAdmin();
  }
}

@Controller('ads-admin/action-items')
@UseGuards(AdsAdminGuard)
export class AdsAdminActionItemsController {
  constructor(private readonly service: AdminActionItemsService) {}

  @Get()
  list() {
    return this.service.forAdsAdmin();
  }
}
