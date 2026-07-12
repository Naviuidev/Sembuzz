import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserGuard } from '../guards/user.guard';
import { UserDirectChatsService } from './user-direct-chats.service';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';
import {
  buildChatAttachmentResponse,
  chatAttachmentMulterOptions,
} from '../../chat-messages/chat-attachment.util';

@Controller('user/direct-chats')
@UseGuards(UserGuard)
export class UserDirectChatsController {
  constructor(private readonly service: UserDirectChatsService) {}

  @Get('availability')
  async availability(@Request() req: { user: { sub: string } }) {
    return this.service.getAvailability(req.user.sub);
  }

  @Get('unread-count')
  async unreadCount(@Request() req: { user: { sub: string } }) {
    return this.service.getUnreadCount(req.user.sub);
  }

  @Get('inbox')
  async listInbox(@Request() req: { user: { sub: string } }) {
    return this.service.listInbox(req.user.sub);
  }

  @Post('upload-attachment')
  @UseInterceptors(FileInterceptor('file', chatAttachmentMulterOptions()))
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please select a file to upload.');
    }
    return buildChatAttachmentResponse(file);
  }

  @Get('students')
  async listStudents(
    @Request() req: { user: { sub: string } },
    @Query('q') q?: string,
  ) {
    return this.service.listStudents(req.user.sub, q);
  }

  @Get()
  async list(@Request() req: { user: { sub: string } }) {
    return this.service.listConversations(req.user.sub);
  }

  @Post('request/:otherUserId')
  async sendRequest(
    @Request() req: { user: { sub: string } },
    @Param('otherUserId') otherUserId: string,
  ) {
    return this.service.sendRequest(req.user.sub, otherUserId);
  }

  @Post(':id/accept')
  async acceptRequest(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.service.acceptRequest(req.user.sub, id);
  }

  @Post(':id/read')
  async markRead(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.service.markRead(req.user.sub, id);
  }

  @Post(':id/block')
  async blockConversation(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.service.blockConversation(req.user.sub, id);
  }

  @Post(':id/unblock')
  async unblockConversation(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.service.unblockConversation(req.user.sub, id);
  }

  @Get(':id/messages')
  async listMessages(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.service.listMessages(req.user.sub, id);
  }

  @Post(':id/messages')
  async sendMessage(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: SendDirectMessageDto,
  ) {
    return this.service.sendMessage(req.user.sub, id, dto);
  }
}
