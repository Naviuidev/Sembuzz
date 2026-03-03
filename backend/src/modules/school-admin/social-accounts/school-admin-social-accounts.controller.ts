import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { SchoolAdminSocialAccountsService } from './school-admin-social-accounts.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'text/xml',           // SVG sometimes reported as text/xml
  'application/xml',    // SVG sometimes reported as application/xml
];
const CLUB_ICONS_DIR = path.join(process.cwd(), 'uploads', 'school-admin-club-icons');

function isAllowedFile(file: Express.Multer.File): boolean {
  const ext = (path.extname(file.originalname) || '').toLowerCase();
  if (ext === '.svg') return true; // Allow any MIME for .svg (browsers vary)
  return ALLOWED_MIMES.includes(file.mimetype);
}

@Controller('school-admin/social-accounts')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminSocialAccountsController {
  constructor(private readonly service: SchoolAdminSocialAccountsService) {}

  @Post('upload-icon')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(CLUB_ICONS_DIR)) {
            fs.mkdirSync(CLUB_ICONS_DIR, { recursive: true });
          }
          cb(null, CLUB_ICONS_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '.png';
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async uploadIcon(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('Please select a file to upload.');
    if (!isAllowedFile(file)) {
      throw new BadRequestException(
        'Allowed types: JPEG, PNG, GIF, WebP, SVG. Your file may have an unexpected MIME type—try renaming to .svg or use a PNG.',
      );
    }
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    return {
      url: `${baseUrl}/uploads/school-admin-club-icons/${file.filename}`,
    };
  }

  @Get()
  async list(@Request() req: { user: { schoolId: string } }) {
    return this.service.findAllForSchool(req.user.schoolId);
  }

  @Post('bulk')
  async createBulk(
    @Request() req: { user: { schoolId: string } },
    @Body() body: { accounts: CreateSocialAccountDto[] },
  ) {
    return this.service.createMany(req.user.schoolId, body.accounts);
  }

  @Post()
  async create(@Request() req: { user: { schoolId: string } }, @Body() dto: CreateSocialAccountDto) {
    return this.service.create(req.user.schoolId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: { schoolId: string } },
    @Body() dto: UpdateSocialAccountDto,
  ) {
    return this.service.update(id, req.user.schoolId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: { user: { schoolId: string } }) {
    return this.service.remove(id, req.user.schoolId);
  }
}
