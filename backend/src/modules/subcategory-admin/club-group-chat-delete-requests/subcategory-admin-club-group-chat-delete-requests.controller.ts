import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { ClubGroupChatDeleteRequestsService } from '../../club-group-chat-delete-requests/club-group-chat-delete-requests.service';
import { CreateClubGroupChatDeleteRequestDto } from '../../club-group-chat-delete-requests/dto/create-club-group-chat-delete-request.dto';

@Controller('subcategory-admin/club-group-chat-delete-requests')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminClubGroupChatDeleteRequestsController {
  constructor(private readonly service: ClubGroupChatDeleteRequestsService) {}

  @Get()
  async listMine(@Request() req: { user: { sub: string } }) {
    return this.service.listForSubCategoryAdmin(req.user.sub);
  }

  @Post()
  async create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateClubGroupChatDeleteRequestDto,
  ) {
    return this.service.createForSubCategoryAdmin(req.user.sub, dto);
  }
}
