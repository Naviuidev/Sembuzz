import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserGuard } from '../guards/user.guard';
import { UserClubGroupChatsService } from './user-club-group-chats.service';
import { SendClubGroupMessageDto } from './dto/send-club-group-message.dto';
import {
  buildChatAttachmentResponse,
  chatAttachmentMulterOptions,
} from '../../chat-messages/chat-attachment.util';

@Controller('user/club-group-chats')
@UseGuards(UserGuard)
export class UserClubGroupChatsController {
  constructor(private readonly service: UserClubGroupChatsService) {}

  @Get('joinable')
  async listJoinable(@Request() req: { user: { sub: string } }) {
    return this.service.listJoinable(req.user.sub);
  }

  @Get()
  async list(@Request() req: { user: { sub: string } }) {
    return this.service.listForUser(req.user.sub);
  }

  @Post('upload-attachment')
  @UseInterceptors(FileInterceptor('file', chatAttachmentMulterOptions()))
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please select a file to upload.');
    }
    return buildChatAttachmentResponse(file);
  }

  @Post(':id/join-request')
  async requestJoin(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.service.requestJoin(req.user.sub, id);
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
    @Body() dto: SendClubGroupMessageDto,
  ) {
    return this.service.sendMessage(req.user.sub, id, dto);
  }
}
