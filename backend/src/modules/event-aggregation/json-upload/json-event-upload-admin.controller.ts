import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminGuard } from '../../super-admin/guards/super-admin.guard';
import { CreateJsonUploadDto } from './dto/create-json-upload.dto';
import { JsonEventUploadService } from './json-event-upload.service';

@Controller('super-admin/json-upload')
@UseGuards(SuperAdminGuard)
export class JsonEventUploadAdminController {
  constructor(private readonly service: JsonEventUploadService) {}

  @Post()
  create(@Body() dto: CreateJsonUploadDto) {
    return this.service.createFromRawEvents(dto.fileName, dto.events);
  }

  @Get('groups')
  listGroups() {
    return this.service.listGroups();
  }

  @Get('groups/:id')
  getGroup(@Param('id') id: string) {
    return this.service.getGroup(id);
  }

  @Delete('groups/:id')
  deleteGroup(@Param('id') id: string) {
    return this.service.deleteGroup(id);
  }

  @Post('groups/:id/publish')
  publishGroup(@Param('id') id: string) {
    return this.service.publishGroup(id);
  }
}
