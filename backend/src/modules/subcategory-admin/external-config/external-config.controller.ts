import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { SubcategoryExternalActionDto } from './dto/external-action.dto';
import { SubcategoryExternalReplyDto } from './dto/external-reply.dto';
import { SubCategoryAdminExternalConfigService } from './external-config.service';

@Controller('subcategory-admin/external-config')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminExternalConfigController {
  constructor(private readonly service: SubCategoryAdminExternalConfigService) {}

  @Get('category-links/pending-count')
  linkPendingCount(@Request() req: { user: { sub: string } }) {
    return this.service.linkPendingCount(req.user.sub);
  }

  @Get('posts/pending-count')
  postPendingCount(@Request() req: { user: { sub: string } }) {
    return this.service.postPendingCount(req.user.sub);
  }

  @Get('category-links')
  listLinks(@Request() req: { user: { sub: string } }) {
    return this.service.listCategoryLinks(req.user.sub);
  }

  @Get('category-links/:id')
  getLink(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.service.getCategoryLink(req.user.sub, id);
  }

  @Post('category-links/:id/send-query')
  linkQuery(@Request() req: { user: { sub: string } }, @Param('id') id: string, @Body() dto: SubcategoryExternalActionDto) {
    return this.service.linkSendQuery(req.user.sub, id, dto);
  }

  @Post('category-links/:id/reply')
  linkReply(@Request() req: { user: { sub: string } }, @Param('id') id: string, @Body() dto: SubcategoryExternalReplyDto) {
    return this.service.linkReply(req.user.sub, id, dto);
  }

  @Post('category-links/:id/approve')
  linkApprove(@Request() req: { user: { sub: string } }, @Param('id') id: string, @Body() dto: SubcategoryExternalActionDto) {
    return this.service.linkApprove(req.user.sub, id, dto);
  }

  @Post('category-links/:id/reject')
  linkReject(@Request() req: { user: { sub: string } }, @Param('id') id: string, @Body() dto: SubcategoryExternalActionDto) {
    return this.service.linkReject(req.user.sub, id, dto);
  }

  @Post('category-links/:id/ban')
  linkBan(@Request() req: { user: { sub: string } }, @Param('id') id: string, @Body() dto: SubcategoryExternalActionDto) {
    return this.service.linkBan(req.user.sub, id, dto);
  }

  @Get('posts')
  listPosts(@Request() req: { user: { sub: string } }) {
    return this.service.listApprovedCategoryPosts(req.user.sub);
  }

  @Get('posts/:id')
  getPost(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.service.getPost(req.user.sub, id);
  }

  @Post('posts/:id/send-query')
  postQuery(@Request() req: { user: { sub: string } }, @Param('id') id: string, @Body() dto: SubcategoryExternalActionDto) {
    return this.service.postSendQuery(req.user.sub, id, dto);
  }

  @Post('posts/:id/reply')
  postReply(@Request() req: { user: { sub: string } }, @Param('id') id: string, @Body() dto: SubcategoryExternalReplyDto) {
    return this.service.postReply(req.user.sub, id, dto);
  }

  @Post('posts/:id/approve')
  postApprove(@Request() req: { user: { sub: string } }, @Param('id') id: string, @Body() dto: SubcategoryExternalActionDto) {
    return this.service.postApprove(req.user.sub, id, dto);
  }

  @Post('posts/:id/reject')
  postReject(@Request() req: { user: { sub: string } }, @Param('id') id: string, @Body() dto: SubcategoryExternalActionDto) {
    return this.service.postReject(req.user.sub, id, dto);
  }

  @Post('posts/:id/ban')
  postBan(@Request() req: { user: { sub: string } }, @Param('id') id: string, @Body() dto: SubcategoryExternalActionDto) {
    return this.service.postBan(req.user.sub, id, dto);
  }
}
