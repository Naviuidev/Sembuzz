import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PendingUsersService } from './pending-users.service';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { AskReuploadDto } from './dto/ask-reupload.dto';

@Controller('school-admin/pending-users')
@UseGuards(SchoolAdminGuard)
export class PendingUsersController {
  constructor(private readonly pendingUsersService: PendingUsersService) {}

  @Get()
  async list(@Request() req: { user: { sub: string; schoolId: string } }) {
    return this.pendingUsersService.findPendingForSchool(req.user.schoolId);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Request() req: { user: { sub: string; schoolId: string } },
  ) {
    return this.pendingUsersService.approve(id, req.user.schoolId);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Request() req: { user: { sub: string; schoolId: string } },
  ) {
    return this.pendingUsersService.reject(id, req.user.schoolId);
  }

  @Post(':id/request-docs')
  async requestDocs(
    @Param('id') id: string,
    @Request() req: { user: { sub: string; schoolId: string } },
  ) {
    return this.pendingUsersService.requestDocs(id, req.user.schoolId);
  }

  @Post(':id/ask-reupload')
  async askReupload(
    @Param('id') id: string,
    @Body() body: AskReuploadDto,
    @Request() req: { user: { sub: string; schoolId: string } },
  ) {
    const text = (body.message || '').trim();
    const type = body.type === 'additional' ? 'additional' : 'reupload';
    return this.pendingUsersService.askReupload(id, req.user.schoolId, text, type);
  }
}
