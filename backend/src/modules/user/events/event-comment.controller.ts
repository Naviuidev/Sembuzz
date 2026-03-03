import { Controller, Delete, Param, Request, UseGuards } from '@nestjs/common';
import { UserGuard } from '../guards/user.guard';
import { UserEventsService } from './user-events.service';

@Controller('user/event-comment')
@UseGuards(UserGuard)
export class EventCommentController {
  constructor(private readonly userEventsService: UserEventsService) {}

  @Delete(':commentId')
  async deleteComment(
    @Request() req: { user: { sub: string } },
    @Param('commentId') commentId: string,
  ) {
    return this.userEventsService.deleteComment(commentId, req.user.sub);
  }
}
