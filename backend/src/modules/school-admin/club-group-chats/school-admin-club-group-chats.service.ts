import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpsertClubGroupChatDto } from './dto/upsert-club-group-chat.dto';

const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';

@Injectable()
export class SchoolAdminClubGroupChatsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertGroupMessagingEnabled(schoolId: string) {
    const enabled = await this.prisma.schoolFeature.findFirst({
      where: {
        schoolId,
        isEnabled: true,
        feature: { code: GROUP_MESSAGING_CODE },
      },
      select: { id: true },
    });
    if (!enabled) {
      throw new ForbiddenException('Group messaging is not enabled for this school.');
    }
  }

  async listForSchool(schoolId: string) {
    await this.assertGroupMessagingEnabled(schoolId);
    return this.prisma.clubGroupChat.findMany({
      where: { schoolId, isEnabled: true },
      orderBy: { pageName: 'asc' },
      select: {
        id: true,
        clubKey: true,
        pageName: true,
        icon: true,
        isEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
  }

  async upsert(schoolId: string, dto: UpsertClubGroupChatDto) {
    await this.assertGroupMessagingEnabled(schoolId);

    const clubExists = await this.prisma.schoolSocialAccount.findFirst({
      where: {
        schoolId,
        pageName: dto.pageName,
        icon: dto.icon,
      },
      select: { id: true },
    });
    if (!clubExists) {
      throw new BadRequestException(
        'Club not found. Create the club under Social Share before enabling group chat.',
      );
    }

    return this.prisma.clubGroupChat.upsert({
      where: {
        schoolId_clubKey: { schoolId, clubKey: dto.clubKey },
      },
      create: {
        schoolId,
        clubKey: dto.clubKey,
        pageName: dto.pageName,
        icon: dto.icon,
        isEnabled: true,
      },
      update: {
        pageName: dto.pageName,
        icon: dto.icon,
        isEnabled: true,
      },
      select: {
        id: true,
        clubKey: true,
        pageName: true,
        icon: true,
        isEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByClubKey(schoolId: string, clubKey: string) {
    const chat = await this.prisma.clubGroupChat.findUnique({
      where: { schoolId_clubKey: { schoolId, clubKey } },
      select: {
        id: true,
        clubKey: true,
        pageName: true,
        icon: true,
        isEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!chat) throw new NotFoundException('Club group chat not found.');
    return chat;
  }
}
