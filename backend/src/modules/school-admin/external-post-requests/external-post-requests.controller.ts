import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { ExternalPostActionDto } from './dto/post-action.dto';
import { ExternalPostReplyDto } from './dto/post-reply.dto';
import { SchoolAdminExternalPostRequestsService } from './external-post-requests.service';

@Controller('school-admin/external-post-requests')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminExternalPostRequestsController {
  constructor(private readonly service: SchoolAdminExternalPostRequestsService) {}

  @Get('requests')
  list(@Request() req: { user: { schoolId: string } }) {
    return this.service.listForSchool(req.user.schoolId);
  }

  @Get('requests/pending-count')
  pendingCount(@Request() req: { user: { schoolId: string } }) {
    return this.service.pendingCount(req.user.schoolId);
  }

  @Get('requests/:id')
  getOne(@Request() req: { user: { schoolId: string } }, @Param('id') id: string) {
    return this.service.getForSchool(id, req.user.schoolId);
  }

  @Post('requests/:id/reply')
  reply(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
    @Body() dto: ExternalPostReplyDto,
  ) {
    return this.service.reply(req.user.sub, req.user.schoolId, id, dto);
  }

  @Post('requests/:id/send-query')
  sendQuery(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
    @Body() dto: ExternalPostActionDto,
  ) {
    return this.service.sendQuery(req.user.sub, req.user.schoolId, id, dto);
  }

  @Post('requests/:id/approve')
  approve(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
    @Body() dto: ExternalPostActionDto,
  ) {
    return this.service.approve(req.user.sub, req.user.schoolId, id, dto);
  }

  @Post('requests/:id/reject')
  reject(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
    @Body() dto: ExternalPostActionDto,
  ) {
    return this.service.reject(req.user.sub, req.user.schoolId, id, dto);
  }

  @Post('requests/:id/ban')
  ban(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
    @Body() dto: ExternalPostActionDto,
  ) {
    return this.service.ban(req.user.sub, req.user.schoolId, id, dto);
  }
}
