import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { PipelineActionMessageDto } from './dto/pipeline-action.dto';
import { PipelineReplyDto } from './dto/pipeline-reply.dto';
import { SchoolAdminExternalPipelineService } from './external-pipeline.service';

@Controller('school-admin/external-pipeline')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminExternalPipelineController {
  constructor(private readonly service: SchoolAdminExternalPipelineService) {}

  @Get('requests')
  list(@Request() req: { user: { schoolId: string } }) {
    return this.service.listForSchool(req.user.schoolId);
  }

  @Get('requests/:id')
  getOne(@Request() req: { user: { schoolId: string } }, @Param('id') id: string) {
    return this.service.getForSchool(id, req.user.schoolId);
  }

  @Post('requests/:id/reply')
  reply(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
    @Body() dto: PipelineReplyDto,
  ) {
    return this.service.reply(req.user.sub, req.user.schoolId, id, dto);
  }

  @Get('requests/pending-count')
  pendingCount(@Request() req: { user: { schoolId: string } }) {
    return this.service.pendingCount(req.user.schoolId);
  }

  @Post('requests/:id/send-query')
  sendQuery(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
    @Body() dto: PipelineActionMessageDto,
  ) {
    return this.service.sendQuery(req.user.sub, req.user.schoolId, id, dto);
  }

  @Post('requests/:id/approve')
  approve(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
    @Body() dto: PipelineActionMessageDto,
  ) {
    return this.service.approve(req.user.sub, req.user.schoolId, id, dto);
  }

  @Post('requests/:id/reject')
  reject(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
    @Body() dto: PipelineActionMessageDto,
  ) {
    return this.service.reject(req.user.sub, req.user.schoolId, id, dto);
  }

  @Post('requests/:id/ban')
  ban(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
    @Body() dto: PipelineActionMessageDto,
  ) {
    return this.service.ban(req.user.sub, req.user.schoolId, id, dto);
  }
}
