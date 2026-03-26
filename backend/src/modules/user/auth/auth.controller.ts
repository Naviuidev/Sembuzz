import {
  Controller,
  Post,
  Get,
  Body,
  Query,
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
import { UserAuthService } from './auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserGuard } from '../guards/user.guard';

const REGISTRATION_DOCS_DIR = path.join(process.cwd(), 'uploads', 'registration-docs');
const PROFILE_PICS_DIR = path.join(process.cwd(), 'uploads', 'profile-pics');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('user/auth')
export class UserAuthController {
  constructor(private readonly authService: UserAuthService) {}

  @Get('schools')
  async getSchools() {
    return this.authService.getSchools();
  }

  @Get('verify-update-doc-token')
  async verifyUpdateDocToken(@Query('token') token: string | undefined) {
    return this.authService.verifyUpdateDocToken(token || '');
  }

  @Get('verify-approval')
  async verifyApproval(@Query('token') token: string | undefined) {
    return this.authService.verifyApprovalToken(token || '');
  }

  @Post('submit-update-doc')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(REGISTRATION_DOCS_DIR)) {
            fs.mkdirSync(REGISTRATION_DOCS_DIR, { recursive: true });
          }
          cb(null, REGISTRATION_DOCS_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '';
          const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async submitUpdateDoc(
    @Request() req: { body?: { token?: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const token = req.body?.token;
    if (!token) {
      throw new BadRequestException('Link expired or invalid. Please use the latest link from your email.');
    }
    if (!file) {
      throw new BadRequestException('Please select a file to upload.');
    }
    const docUrl = `/uploads/registration-docs/${file.filename}`;
    return this.authService.submitUpdateDoc(token, docUrl);
  }

  @Post('upload-registration-doc')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(REGISTRATION_DOCS_DIR)) {
            fs.mkdirSync(REGISTRATION_DOCS_DIR, { recursive: true });
          }
          cb(null, REGISTRATION_DOCS_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '';
          const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadRegistrationDoc(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Please select a file to upload.');
    }
    const url = `/uploads/registration-docs/${file.filename}`;
    return { url };
  }

  @Post('upload-profile-pic')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(PROFILE_PICS_DIR)) {
            fs.mkdirSync(PROFILE_PICS_DIR, { recursive: true });
          }
          cb(null, PROFILE_PICS_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '.jpg';
          const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadProfilePic(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Please select a file to upload.');
    }
    const url = `/uploads/profile-pics/${file.filename}`;
    return { url };
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(UserGuard)
  async getMe(@Request() req: { user: { sub: string } }) {
    return this.authService.getMe(req.user.sub);
  }

  @Post('delete-account')
  @UseGuards(UserGuard)
  async deleteAccount(
    @Request() req: { user: { sub: string } },
    @Body() dto: DeleteAccountDto,
  ) {
    return this.authService.deleteAccount(req.user.sub, dto.password);
  }

  @Post('update-profile')
  @UseGuards(UserGuard)
  async updateProfile(
    @Request() req: { user: { sub: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.sub, dto);
  }
}
