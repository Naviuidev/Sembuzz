import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { MasterAdminGuard } from '../guards/master-admin.guard';
import type { MasterAdminJwtPayload } from '../types/master-admin-jwt.types';
import { MasterAdminSchoolsService } from './schools.service';

@Controller('master-admin/schools')
@UseGuards(MasterAdminGuard)
export class MasterAdminSchoolsController {
  constructor(private readonly schoolsService: MasterAdminSchoolsService) {}

  @Get()
  list(@Request() req: { user: MasterAdminJwtPayload }) {
    return this.schoolsService.list(req.user);
  }

  @Get(':id/overview')
  getOverview(@Request() req: { user: MasterAdminJwtPayload }, @Param('id') id: string) {
    return this.schoolsService.getOverview(id, req.user);
  }

  @Get(':id/posts')
  listPosts(@Request() req: { user: MasterAdminJwtPayload }, @Param('id') id: string) {
    return this.schoolsService.listPosts(id, req.user);
  }

  @Get(':id/posts/:postId')
  getPost(
    @Request() req: { user: MasterAdminJwtPayload },
    @Param('id') schoolId: string,
    @Param('postId') postId: string,
  ) {
    return this.schoolsService.getPost(schoolId, postId, req.user);
  }

  @Get(':id/users')
  listUsers(@Request() req: { user: MasterAdminJwtPayload }, @Param('id') id: string) {
    return this.schoolsService.listUsers(id, req.user);
  }

  @Get(':id/blogs')
  listBlogs(@Request() req: { user: MasterAdminJwtPayload }, @Param('id') id: string) {
    return this.schoolsService.listBlogs(id, req.user);
  }

  @Get(':id/upcoming')
  listUpcoming(@Request() req: { user: MasterAdminJwtPayload }, @Param('id') id: string) {
    return this.schoolsService.listUpcoming(id, req.user);
  }

  @Get(':id/banner-ads')
  listBannerAds(@Request() req: { user: MasterAdminJwtPayload }, @Param('id') id: string) {
    return this.schoolsService.listBannerAds(id, req.user);
  }

  @Get(':id/sponsored-ads')
  listSponsoredAds(@Request() req: { user: MasterAdminJwtPayload }, @Param('id') id: string) {
    return this.schoolsService.listSponsoredAds(id, req.user);
  }

  @Get(':id/privacy')
  getPrivacy(@Request() req: { user: MasterAdminJwtPayload }, @Param('id') id: string) {
    return this.schoolsService.getPrivacy(id, req.user);
  }
}
