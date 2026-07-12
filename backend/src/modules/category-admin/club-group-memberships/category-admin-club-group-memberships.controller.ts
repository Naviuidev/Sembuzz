import { Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CategoryAdminGuard } from '../guards/category-admin.guard';
import {
  CategoryAdminClubGroupMembershipsService,
  type MembershipStatus,
} from './category-admin-club-group-memberships.service';

@Controller('category-admin/club-group-memberships')
@UseGuards(CategoryAdminGuard)
export class CategoryAdminClubGroupMembershipsController {
  constructor(private readonly service: CategoryAdminClubGroupMembershipsService) {}

  @Get()
  async list(
    @Request() req: { user: { schoolId: string } },
    @Query('status') status?: string,
  ) {
    const s = (status === 'approved' || status === 'banned' ? status : 'pending') as MembershipStatus;
    return this.service.listForSchool(req.user.schoolId, s);
  }

  @Post(':id/approve')
  async approve(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id') id: string,
  ) {
    return this.service.approve(id, req.user.schoolId, req.user.sub);
  }

  @Post(':id/ban')
  async ban(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id') id: string,
  ) {
    return this.service.ban(id, req.user.schoolId, req.user.sub);
  }
}
