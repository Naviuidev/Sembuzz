import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserGuard } from '../guards/user.guard';
import { UserEventsService } from './user-events.service';
import { AddCommentDto } from './dto/add-comment.dto';

@Controller('user/events')
@UseGuards(UserGuard)
export class UserEventsController {
  constructor(private readonly userEventsService: UserEventsService) {}

  @Get('engagement')
  async getEngagement(
    @Request() req: { user: { sub: string } },
    @Query('eventIds') eventIdsStr?: string,
  ) {
    const eventIds =
      eventIdsStr && eventIdsStr.trim()
        ? eventIdsStr.split(',').map((id) => id.trim()).filter(Boolean)
        : [];
    return this.userEventsService.getEngagement(eventIds, req.user.sub);
  }

  @Get('saved')
  async getSavedEvents(@Request() req: { user: { sub: string } }) {
    return this.userEventsService.getSavedEvents(req.user.sub);
  }

  @Get('list/liked')
  async getLikedEvents(@Request() req: { user: { sub: string } }) {
    return this.userEventsService.getLikedEvents(req.user.sub);
  }

  @Post(':eventId/like')
  async toggleLike(
    @Request() req: { user: { sub: string } },
    @Param('eventId') eventId: string,
  ) {
    return this.userEventsService.toggleLike(eventId, req.user.sub);
  }

  @Get(':eventId/comments')
  async getComments(
    @Request() req: { user: { sub: string } },
    @Param('eventId') eventId: string,
  ) {
    return this.userEventsService.getComments(eventId, req.user.sub);
  }

  @Post(':eventId/comments')
  async addComment(
    @Request() req: { user: { sub: string } },
    @Param('eventId') eventId: string,
    @Body() dto: AddCommentDto,
  ) {
    return this.userEventsService.addComment(eventId, req.user.sub, dto.text);
  }

  @Post(':eventId/save')
  async toggleSave(
    @Request() req: { user: { sub: string } },
    @Param('eventId') eventId: string,
  ) {
    return this.userEventsService.toggleSave(eventId, req.user.sub);
  }
}
