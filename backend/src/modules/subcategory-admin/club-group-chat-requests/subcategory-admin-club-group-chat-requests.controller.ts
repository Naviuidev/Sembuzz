import { Body, Controller, ForbiddenException, Get, Post, Request, UseGuards } from '@nestjs/common';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { ClubGroupChatRequestsService } from '../../club-group-chat-requests/club-group-chat-requests.service';
import { CreateClubGroupChatRequestDto } from '../../club-group-chat-requests/dto/create-club-group-chat-request.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('subcategory-admin/club-group-chat-requests')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminClubGroupChatRequestsController {
  constructor(
    private readonly service: ClubGroupChatRequestsService,
    private readonly prisma: PrismaService,
  ) {}

  private async schoolIdForAdmin(adminId: string) {
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: adminId },
      select: { schoolId: true, isActive: true },
    });
    if (!admin?.isActive) {
      throw new ForbiddenException('Account is not active.');
    }
    return admin.schoolId;
  }

  @Get('clubs')
  async listClubs(@Request() req: { user: { sub: string } }) {
    const schoolId = await this.schoolIdForAdmin(req.user.sub);
    return this.service.listClubsForSchool(schoolId);
  }

  @Get()
  async listMine(@Request() req: { user: { sub: string } }) {
    return this.service.listForSubCategoryAdmin(req.user.sub);
  }

  @Post()
  async create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateClubGroupChatRequestDto,
  ) {
    return this.service.createForSubCategoryAdmin(req.user.sub, dto);
  }
}
