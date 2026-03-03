import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UserEventsService {
  constructor(private prisma: PrismaService) {}

  private async ensureUserInSchool(userId: string, schoolId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
    });
    if (!user || user.schoolId !== schoolId) {
      throw new ForbiddenException('Event not in your school');
    }
  }

  private async getEventSchoolId(eventId: string): Promise<string> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { schoolId: true, status: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== 'approved') throw new NotFoundException('Event not found');
    return event.schoolId;
  }

  async getEngagement(eventIds: string[], userId: string) {
    if (!eventIds.length) {
      return { likes: {} as Record<string, number>, commentCounts: {} as Record<string, number>, likedByMe: [] as string[], savedByMe: [] as string[] };
    }
    const [likeCounts, commentCounts, likesByUser, savedByUser] = await Promise.all([
      this.prisma.eventLike.groupBy({
        by: ['eventId'],
        where: { eventId: { in: eventIds } },
        _count: { eventId: true },
      }),
      this.prisma.eventComment.groupBy({
        by: ['eventId'],
        where: { eventId: { in: eventIds } },
        _count: { eventId: true },
      }),
      this.prisma.eventLike.findMany({
        where: { eventId: { in: eventIds }, userId },
        select: { eventId: true },
      }),
      this.prisma.userSavedEvent.findMany({
        where: { eventId: { in: eventIds }, userId },
        select: { eventId: true },
      }),
    ]);
    const likes: Record<string, number> = {};
    eventIds.forEach((id) => (likes[id] = 0));
    likeCounts.forEach((g) => (likes[g.eventId] = g._count.eventId));
    const commentCountsMap: Record<string, number> = {};
    eventIds.forEach((id) => (commentCountsMap[id] = 0));
    commentCounts.forEach((g) => (commentCountsMap[g.eventId] = g._count.eventId));
    return {
      likes,
      commentCounts: commentCountsMap,
      likedByMe: likesByUser.map((l) => l.eventId),
      savedByMe: savedByUser.map((s) => s.eventId),
    };
  }

  async toggleLike(eventId: string, userId: string) {
    const schoolId = await this.getEventSchoolId(eventId);
    await this.ensureUserInSchool(userId, schoolId);
    const existing = await this.prisma.eventLike.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) {
      await this.prisma.eventLike.delete({
        where: { eventId_userId: { eventId, userId } },
      });
      const count = await this.prisma.eventLike.count({ where: { eventId } });
      return { liked: false, count };
    }
    await this.prisma.eventLike.create({
      data: { eventId, userId },
    });
    const count = await this.prisma.eventLike.count({ where: { eventId } });
    return { liked: true, count };
  }

  async getComments(eventId: string, userId: string) {
    const schoolId = await this.getEventSchoolId(eventId);
    await this.ensureUserInSchool(userId, schoolId);
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { commentsEnabled: true },
    });
    if (!event?.commentsEnabled) return [];
    return this.prisma.eventComment.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, profilePicUrl: true } },
      },
    });
  }

  async addComment(eventId: string, userId: string, text: string) {
    const schoolId = await this.getEventSchoolId(eventId);
    await this.ensureUserInSchool(userId, schoolId);
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { commentsEnabled: true },
    });
    if (!event?.commentsEnabled) {
      throw new ForbiddenException('Comments are disabled for this post');
    }
    const trimmed = (text || '').trim();
    if (!trimmed) throw new ForbiddenException('Comment text is required');
    const comment = await this.prisma.eventComment.create({
      data: { eventId, userId, text: trimmed },
      include: {
        user: { select: { id: true, name: true, profilePicUrl: true } },
      },
    });
    const count = await this.prisma.eventComment.count({ where: { eventId } });
    return { comment, commentCount: count };
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.eventComment.findUnique({
      where: { id: commentId },
      select: { id: true, eventId: true, userId: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comment');
    }
    await this.prisma.eventComment.delete({
      where: { id: commentId },
    });
    const commentCount = await this.prisma.eventComment.count({
      where: { eventId: comment.eventId },
    });
    return { commentCount };
  }

  async toggleSave(eventId: string, userId: string) {
    const schoolId = await this.getEventSchoolId(eventId);
    await this.ensureUserInSchool(userId, schoolId);
    const existing = await this.prisma.userSavedEvent.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) {
      await this.prisma.userSavedEvent.delete({
        where: { userId_eventId: { userId, eventId } },
      });
      return { saved: false };
    }
    await this.prisma.userSavedEvent.create({
      data: { userId, eventId },
    });
    return { saved: true };
  }

  async getSavedEvents(userId: string) {
    const saved = await this.prisma.userSavedEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          include: {
            school: { select: { name: true, image: true, city: true } },
            subCategory: { select: { id: true, name: true } },
          },
        },
      },
    });
    return saved.map((s) => ({ ...s.event, savedAt: s.createdAt }));
  }

  async getLikedEvents(userId: string) {
    const likes = await this.prisma.eventLike.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          include: {
            school: { select: { name: true, image: true, city: true } },
            subCategory: { select: { id: true, name: true } },
          },
        },
      },
    });
    return likes
      .filter((l) => l.event != null && l.event.status === 'approved')
      .map((l) => {
        const e = l.event!;
        return {
          id: e.id,
          title: e.title,
          description: e.description,
          externalLink: e.externalLink,
          imageUrls: e.imageUrls,
          school: e.school,
          subCategory: e.subCategory,
          likedAt: l.createdAt.toISOString(),
        };
      });
  }
}
