import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { ClubGroupChatRequestsService } from '../../club-group-chat-requests/club-group-chat-requests.service';
import { CreateClubGroupChatRequestDto } from '../../club-group-chat-requests/dto/create-club-group-chat-request.dto';
import { PrismaService } from '../../../prisma/prisma.service';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const GROUP_CHAT_ICONS_DIR = path.join(process.cwd(), 'uploads', 'subcategory-admin-group-chat-icons');

@Controller('subcategory-admin/club-group-chat-requests')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminClubGroupChatRequestsController {
  constructor(
    private readonly service: ClubGroupChatRequestsService,
    private readonly prisma: PrismaService,
  ) {}

  private async schoolIdForAdmin(adminId: string) {
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: adminId },
      select: { schoolId: true, isActive: true },
    });
    if (!admin?.isActive) {
      throw new ForbiddenException('Account is not active.');
    }
    return admin.schoolId;
  }

  @Get('clubs')
  async listClubs(@Request() req: { user: { sub: string } }) {
    const schoolId = await this.schoolIdForAdmin(req.user.sub);
    return this.service.listClubsForSchool(schoolId);
  }

  @Get()
  async listMine(@Request() req: { user: { sub: string } }) {
    return this.service.listForSubCategoryAdmin(req.user.sub);
  }

  @Post('upload-icon')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(GROUP_CHAT_ICONS_DIR)) {
            fs.mkdirSync(GROUP_CHAT_ICONS_DIR, { recursive: true });
          }
          cb(null, GROUP_CHAT_ICONS_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '.jpg';
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async uploadIcon(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Allowed types: JPEG, PNG, GIF, WebP');
    }
    return {
      url: `/uploads/subcategory-admin-group-chat-icons/${file.filename}`,
    };
  }

  @Post()
  async create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateClubGroupChatRequestDto,
  ) {
    return this.service.createForSubCategoryAdmin(req.user.sub, dto);
  }
}
