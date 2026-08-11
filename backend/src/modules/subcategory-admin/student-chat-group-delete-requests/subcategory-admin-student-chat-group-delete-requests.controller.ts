import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { StudentChatGroupDeleteRequestsService } from '../../student-chat-group-delete-requests/student-chat-group-delete-requests.service';
import { CreateStudentChatGroupDeleteRequestDto } from '../../student-chat-group-delete-requests/dto/create-student-chat-group-delete-request.dto';

@Controller('subcategory-admin/student-chat-group-delete-requests')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminStudentChatGroupDeleteRequestsController {
  constructor(private readonly service: StudentChatGroupDeleteRequestsService) {}

  @Get()
  async listMine(@Request() req: { user: { sub: string } }) {
    return this.service.listForSubCategoryAdmin(req.user.sub);
  }

  @Post()
  async create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateStudentChatGroupDeleteRequestDto,
  ) {
    return this.service.createForSubCategoryAdmin(req.user.sub, dto);
  }
}
