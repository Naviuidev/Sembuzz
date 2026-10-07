import { Controller, Get, Post, Param, Query, Request, UseGuards } from '@nestjs/common';
import { UserGuard } from '../guards/user.guard';
import { UserExternalFeedService } from './user-external-feed.service';

@Controller('user/external-feed')
@UseGuards(UserGuard)
export class UserExternalFeedController {
  constructor(private readonly externalFeed: UserExternalFeedService) {}

  @Get('categories')
  async categories(@Request() req: { user: { sub: string } }) {
    const schoolId = await this.externalFeed.schoolIdForUser(req.user.sub);
    if (!schoolId) return [];
    return this.externalFeed.listPipelineCategories(schoolId);
  }

  @Get('posts')
  async posts(
    @Request() req: { user: { sub: string } },
    @Query('categoryId') categoryId?: string,
  ) {
    const schoolId = await this.externalFeed.schoolIdForUser(req.user.sub);
    if (!schoolId) return [];
    return this.externalFeed.listPublicPosts(schoolId, categoryId);
  }

  @Get('saved')
  async saved(@Request() req: { user: { sub: string } }) {
    return this.externalFeed.listSavedPosts(req.user.sub);
  }

  @Get('engagement')
  async engagement(
    @Request() req: { user: { sub: string } },
    @Query('postIds') postIdsStr?: string,
  ) {
    const postIds =
      postIdsStr && postIdsStr.trim()
        ? postIdsStr.split(',').map((id) => id.trim()).filter(Boolean)
        : [];
    const savedByMe = await this.externalFeed.getSavedPostIds(req.user.sub, postIds);
    return { savedByMe };
  }

  @Post('posts/:postId/save')
  async toggleSave(
    @Request() req: { user: { sub: string } },
    @Param('postId') postId: string,
  ) {
    return this.externalFeed.toggleSavePost(req.user.sub, postId);
  }
}
