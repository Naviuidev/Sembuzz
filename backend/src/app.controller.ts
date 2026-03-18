import { Controller, Get, Query, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { PublishedBlogsService } from './published-blogs.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly publishedBlogs: PublishedBlogsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Public blog list (also under /events/blogs). Registered here so GET always resolves even if /events/* routing differs on host. */
  @Get('public/blogs')
  listPublicBlogs(
    @Query('schoolId') schoolId?: string,
    @Query('q') q?: string,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
    @Query('subCategoryIds') subCategoryIds?: string,
  ) {
    return this.publishedBlogs.listPublishedBlogs(
      schoolId,
      q,
      fromStr,
      toStr,
      subCategoryIds,
    );
  }

  @Get('public/blog/:id')
  getPublicBlogById(@Param('id') id: string) {
    return this.publishedBlogs.getPublishedBlogById(id);
  }
}
