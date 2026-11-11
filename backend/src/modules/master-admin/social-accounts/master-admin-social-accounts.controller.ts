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
import { MasterAdminSocialAccountsService } from './master-admin-social-accounts.service';
import { CreateMasterAdminSocialAccountDto } from './dto/create-master-admin-social-account.dto';
import { CreateMasterAdminSocialBulkDto } from './dto/create-master-admin-social-bulk.dto';
import { UpdateMasterAdminSocialAccountDto } from './dto/update-master-admin-social-account.dto';

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'text/xml',
  'application/xml',
];
const CLUB_ICONS_DIR = path.join(process.cwd(), 'uploads', 'school-admin-club-icons');

function isAllowedFile(file: Express.Multer.File): boolean {
  const ext = (path.extname(file.originalname) || '').toLowerCase();
  if (ext === '.svg') return true;
  return ALLOWED_MIMES.includes(file.mimetype);
}

@Controller('master-admin/social-accounts')
@UseGuards(MasterAdminGuard)
export class MasterAdminSocialAccountsController {
  constructor(private readonly service: MasterAdminSocialAccountsService) {}

  @Get()
  list(@Query('schoolId') schoolId: string) {
    if (!schoolId?.trim()) throw new BadRequestException('schoolId is required');
    return this.service.list(schoolId.trim());
  }

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
  uploadIcon(@UploadedFile() file: Express.Multer.File): { url: string } {
    if (!file) throw new BadRequestException('Please select a file to upload.');
    if (!isAllowedFile(file)) {
      throw new BadRequestException('Allowed types: JPEG, PNG, GIF, WebP, SVG.');
    }
    return { url: `/uploads/school-admin-club-icons/${file.filename}` };
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Query('schoolId') schoolId: string) {
    if (!schoolId?.trim()) throw new BadRequestException('schoolId is required');
    return this.service.getOne(id, schoolId.trim());
  }

  @Post('bulk')
  createBulk(@Body() body: CreateMasterAdminSocialBulkDto) {
    return this.service.createMany(body.schoolId, body.accounts);
  }

  @Post()
  create(@Body() body: CreateMasterAdminSocialAccountDto) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateMasterAdminSocialAccountDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('schoolId') schoolId: string) {
    if (!schoolId?.trim()) throw new BadRequestException('schoolId is required');
    return this.service.remove(id, schoolId.trim());
  }
}
