import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CategoryAdminGuard } from '../guards/category-admin.guard';
import { CategoryAdminBlogsService } from './category-admin-blogs.service';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { RevertBlogDto } from './dto/revert-blog.dto';
import { RejectBlogDto } from './dto/reject-blog.dto';
@Controller('category-admin/blogs')
@UseGuards(CategoryAdminGuard)
export class CategoryAdminBlogsController {
  constructor(private readonly blogsService: CategoryAdminBlogsService) {}

  @Get('pending')
  async pending(@Request() req: { user: { sub: string } }) {
    return this.blogsService.findPending(req.user.sub);
  }

  @Get('approved')
  async approved(@Request() req: { user: { sub: string } }) {
    return this.blogsService.findApprovedForCategoryAdmin(req.user.sub);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
    @Body() dto: UpdateBlogDto,
  ) {
    return this.blogsService.update(id, req.user.sub, dto);
  }

  @Post(':id/revert')
  async revert(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
    @Body() dto: RevertBlogDto,
  ) {
    return this.blogsService.revert(id, req.user.sub, dto.revertNotes);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
    @Body() dto: RejectBlogDto,
  ) {
    return this.blogsService.reject(id, req.user.sub, dto.rejectNotes);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.blogsService.approve(id, req.user.sub);
  }

  @Post(':id/publish')
  async publishDraft(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.blogsService.publishDraft(id, req.user.sub);
  }

  /** POST + {} body avoids empty-body JSON parse issues; works if DELETE is blocked (404). */
  @Post(':id/remove-approved')
  async removeViaPost(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.blogsService.removeApproved(id, req.user.sub);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.blogsService.removeApproved(id, req.user.sub);
  }
}
