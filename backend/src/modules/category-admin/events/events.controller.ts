import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CategoryAdminGuard } from '../guards/category-admin.guard';
import { CategoryAdminEventsService } from './events.service';
import { UpdateEventDto } from './dto/update-event.dto';
import { RevertEventDto } from './dto/revert-event.dto';

@Controller('category-admin/events')
@UseGuards(CategoryAdminGuard)
export class CategoryAdminEventsController {
  constructor(private readonly eventsService: CategoryAdminEventsService) {}

  @Get('pending')
  async findPending(@Request() req: { user: { sub: string } }) {
    return this.eventsService.findPendingForCategoryAdmin(req.user.sub);
  }

  @Get('approved')
  async findApproved(@Request() req: { user: { sub: string } }) {
    return this.eventsService.findApprovedForCategoryAdmin(req.user.sub);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.eventsService.delete(id, req.user.sub);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, req.user.sub, dto);
  }

  @Post(':id/revert')
  async revert(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
    @Body() dto: RevertEventDto,
  ) {
    return this.eventsService.revert(id, req.user.sub, dto.revertNotes);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.eventsService.approve(id, req.user.sub);
  }
}
