import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { PlatformMasterAdminGuard } from '../guards/platform-master-admin.guard';
import { ProvisionSchoolMasterAdminDto } from './dto/provision-school-master-admin.dto';
import { MasterAdminDeveloperLayerService } from './master-admin-developer-layer.service';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const DOCS_DIR = path.join(process.cwd(), 'uploads', 'master-admin-developer-docs');

@Controller('master-admin/developer-layer')
@UseGuards(PlatformMasterAdminGuard)
export class MasterAdminDeveloperLayerController {
  constructor(private readonly developerLayerService: MasterAdminDeveloperLayerService) {}

  @Get('admins')
  listAdmins() {
    return this.developerLayerService.listAdmins();
  }

  @Post('upload-document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
          cb(null, DOCS_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '.pdf';
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  uploadDocument(@UploadedFile() file: Express.Multer.File): { url: string } {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Allowed types: JPEG, PNG, WebP, PDF');
    }
    return { url: `/uploads/master-admin-developer-docs/${file.filename}` };
  }

  @Post('provision')
  provision(@Body() body: ProvisionSchoolMasterAdminDto) {
    return this.developerLayerService.provisionEmailAccess(body);
  }
}
