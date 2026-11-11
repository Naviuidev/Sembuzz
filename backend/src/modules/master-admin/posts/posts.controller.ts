import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { MasterAdminGuard } from '../guards/master-admin.guard';
import { MasterAdminPostsService } from './posts.service';
import { CreateMasterAdminPostDto } from './dto/create-master-admin-post.dto';
import { PublishMasterAdminPostDto } from './dto/publish-master-admin-post.dto';
import { UpdateMasterAdminPostDto } from './dto/update-master-admin-post.dto';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const POST_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'school-admin-post-images');

@Controller('master-admin/posts')
@UseGuards(MasterAdminGuard)
export class MasterAdminPostsController {
  constructor(private readonly postsService: MasterAdminPostsService) {}

  @Get()
  list(@Query('schoolId') schoolId?: string) {
    return this.postsService.list(schoolId);
  }

  @Get('schools/:schoolId/categories')
  getCategories(@Param('schoolId') schoolId: string) {
    return this.postsService.getCategoriesForSchool(schoolId);
  }

  @Post()
  create(@Body() body: CreateMasterAdminPostDto) {
    return this.postsService.create(body);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(POST_IMAGES_DIR)) {
            fs.mkdirSync(POST_IMAGES_DIR, { recursive: true });
          }
          cb(null, POST_IMAGES_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '.jpg';
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File): { url: string } {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Allowed types: JPEG, PNG, GIF, WebP');
    }
    return {
      url: `/uploads/school-admin-post-images/${file.filename}`,
    };
  }

  @Get(':postId')
  getOne(@Param('postId') postId: string, @Query('schoolId') schoolId: string) {
    if (!schoolId?.trim()) {
      throw new BadRequestException('schoolId is required');
    }
    return this.postsService.getOne(postId, schoolId.trim());
  }

  @Patch(':postId')
  update(@Param('postId') postId: string, @Body() body: UpdateMasterAdminPostDto) {
    return this.postsService.update(postId, body);
  }

  @Delete(':postId')
  delete(@Param('postId') postId: string, @Query('schoolId') schoolId: string) {
    if (!schoolId?.trim()) {
      throw new BadRequestException('schoolId is required');
    }
    return this.postsService.delete(postId, schoolId.trim());
  }

  @Post(':postId/publish')
  publish(@Param('postId') postId: string, @Body() body: PublishMasterAdminPostDto) {
    return this.postsService.publish(postId, body);
  }
}
