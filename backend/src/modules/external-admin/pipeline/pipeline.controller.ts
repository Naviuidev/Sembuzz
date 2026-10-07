import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ExternalAdminGuard } from '../guards/external-admin.guard';
import { CreatePipelineRequestsDto } from './dto/create-pipeline-requests.dto';
import { ExternalPipelineReplyDto } from './dto/pipeline-reply.dto';
import { ExternalAdminPipelineService } from './pipeline.service';

@Controller('external-admin/pipeline')
@UseGuards(ExternalAdminGuard)
export class ExternalAdminPipelineController {
  constructor(private readonly pipelineService: ExternalAdminPipelineService) {}

  @Get('schools')
  listSchools() {
    return this.pipelineService.listSchools();
  }

  @Get('categories')
  listCategories(@Request() req: { user: { sub: string } }) {
    return this.pipelineService.listMyCategories(req.user.sub);
  }

  @Get('requests')
  listRequests(@Request() req: { user: { sub: string } }) {
    return this.pipelineService.listRequests(req.user.sub);
  }

  @Get('requests/:id')
  getRequest(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.pipelineService.getRequest(req.user.sub, id);
  }

  @Post('requests/:id/reply')
  reply(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: ExternalPipelineReplyDto,
  ) {
    return this.pipelineService.reply(req.user.sub, id, dto);
  }

  @Get('requests/summary')
  summary(@Request() req: { user: { sub: string } }) {
    return this.pipelineService.summary(req.user.sub);
  }

  @Post('requests')
  create(@Request() req: { user: { sub: string } }, @Body() dto: CreatePipelineRequestsDto) {
    return this.pipelineService.createRequests(req.user.sub, dto);
  }
}
