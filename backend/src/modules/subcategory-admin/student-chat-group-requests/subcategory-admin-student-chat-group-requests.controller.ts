import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { StudentChatGroupRequestsService } from '../../student-chat-group-requests/student-chat-group-requests.service';
import { CreateStudentChatGroupRequestDto } from '../../student-chat-group-requests/dto/create-student-chat-group-request.dto';

@Controller('subcategory-admin/student-chat-group-requests')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminStudentChatGroupRequestsController {
  constructor(private readonly service: StudentChatGroupRequestsService) {}

  @Get()
  async listMine(@Request() req: { user: { sub: string } }) {
    return this.service.listForSubCategoryAdmin(req.user.sub);
  }

  @Post()
  async create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateStudentChatGroupRequestDto,
  ) {
    return this.service.createForSubCategoryAdmin(req.user.sub, dto);
  }
}
