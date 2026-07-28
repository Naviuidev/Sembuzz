import { Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import {
  SubCategoryAdminClubGroupMembershipsService,
  type MembershipStatus,
} from './subcategory-admin-club-group-memberships.service';

@Controller('subcategory-admin/club-group-memberships')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminClubGroupMembershipsController {
  constructor(private readonly service: SubCategoryAdminClubGroupMembershipsService) {}

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
