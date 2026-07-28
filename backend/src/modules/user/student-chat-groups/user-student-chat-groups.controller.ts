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
import { UserStudentChatGroupsService } from './user-student-chat-groups.service';
import { CreateStudentChatGroupDto } from './dto/create-student-chat-group.dto';
import { SendStudentChatGroupMessageDto } from './dto/send-student-chat-group-message.dto';
import { AddStudentChatGroupMemberDto } from './dto/add-student-chat-group-member.dto';
import {
  buildChatAttachmentResponse,
  chatAttachmentMulterOptions,
} from '../../chat-messages/chat-attachment.util';

@Controller('user/student-chat-groups')
@UseGuards(UserGuard)
export class UserStudentChatGroupsController {
  constructor(private readonly service: UserStudentChatGroupsService) {}

  @Get('unread-count')
  async unreadCount(@Request() req: { user: { sub: string } }) {
    return this.service.getUnreadCount(req.user.sub);
  }

  @Get('inbox')
  async inbox(@Request() req: { user: { sub: string } }) {
    return this.service.listInbox(req.user.sub);
  }

  @Get('discover')
  async discover(@Request() req: { user: { sub: string } }) {
    return this.service.listDiscoverable(req.user.sub);
  }

  @Post()
  async create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateStudentChatGroupDto,
  ) {
    return this.service.createGroup(req.user.sub, dto);
  }

  @Post('upload-attachment')
  @UseInterceptors(FileInterceptor('file', chatAttachmentMulterOptions()))
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please select a file to upload.');
    }
    return buildChatAttachmentResponse(file);
  }

  @Post(':id/join')
  async join(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.service.joinGroup(req.user.sub, id);
  }

  @Post(':id/leave')
  async leave(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.service.leaveGroup(req.user.sub, id);
  }

  @Post(':id/read')
  async markRead(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.service.markRead(req.user.sub, id);
  }

  @Get(':id/members')
  async members(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.service.listMembers(req.user.sub, id);
  }

  @Post(':id/members')
  async addMember(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: AddStudentChatGroupMemberDto,
  ) {
    return this.service.addMember(req.user.sub, id, dto.userId);
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
    @Body() dto: SendStudentChatGroupMessageDto,
  ) {
    return this.service.sendMessage(req.user.sub, id, dto);
  }
}
