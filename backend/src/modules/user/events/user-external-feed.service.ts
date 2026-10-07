import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { postInclude } from '../../external-school-post-messages/post-request-messages.service';

const publicPostWhere = {
  status: 'approved',
  OR: [
    { contentType: { in: ['job', 'offer', 'campaign'] as string[] } },
    { subcategoryStatus: 'approved' },
  ],
};

@Injectable()
export class UserExternalFeedService {
  constructor(private prisma: PrismaService) {}

  async schoolIdForUser(userId: string): Promise<string | null> {
    const id = userId.trim();
    if (!id) return null;
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { schoolId: true },
    });
    const sid = user?.schoolId?.trim() ?? '';
    return sid || null;
  }

  async listPipelineCategories(schoolId: string) {
    const sid = schoolId.trim();
    if (!sid) return [];

    const rows = await this.prisma.externalCategorySchoolPipelineRequest.findMany({
      where: { schoolId: sid, status: 'approved' },
      include: {
        externalCategory: {
          select: { id: true, name: true, description: true, sortOrder: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const byId = new Map<
      string,
      { id: string; name: string; description: string | null; sortOrder: number }
    >();
    for (const row of rows) {
      const cat = row.externalCategory;
      if (!byId.has(cat.id)) {
        byId.set(cat.id, {
          id: cat.id,
          name: cat.name,
          description: cat.description,
          sortOrder: cat.sortOrder,
        });
      }
    }
    return [...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  async listPublicPosts(schoolId: string, categoryId?: string) {
    const sid = schoolId.trim();
    if (!sid) return [];

    const cid = typeof categoryId === 'string' ? categoryId.trim() : '';
    return this.prisma.externalSchoolPostRequest.findMany({
      where: {
        schoolId: sid,
        ...publicPostWhere,
        ...(cid ? { externalCategoryId: cid } : {}),
      },
      include: postInclude,
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
  }

  assertSchoolAccess(userSchoolId: string | undefined, requestedSchoolId: string) {
    const uid = (userSchoolId ?? '').trim();
    const sid = requestedSchoolId.trim();
    if (!uid || !sid || uid !== sid) {
      throw new BadRequestException('External feed is only available for your school.');
    }
  }

  async getSavedPostIds(userId: string, postIds: string[]): Promise<string[]> {
    const uid = userId.trim();
    const ids = [...new Set(postIds.map((id) => id.trim()).filter(Boolean))];
    if (!uid || ids.length === 0) return [];
    const rows = await this.prisma.userSavedExternalPost.findMany({
      where: { userId: uid, postRequestId: { in: ids } },
      select: { postRequestId: true },
    });
    return rows.map((r) => r.postRequestId);
  }

  async toggleSavePost(userId: string, postRequestId: string) {
    const uid = userId.trim();
    const pid = postRequestId.trim();
    if (!uid || !pid) throw new BadRequestException('Invalid save request.');

    const schoolId = await this.schoolIdForUser(uid);
    if (!schoolId) throw new BadRequestException('School not found.');

    const post = await this.prisma.externalSchoolPostRequest.findFirst({
      where: { id: pid, schoolId, ...publicPostWhere },
      select: { id: true },
    });
    if (!post) throw new BadRequestException('Post not found or not available.');

    const existing = await this.prisma.userSavedExternalPost.findUnique({
      where: { userId_postRequestId: { userId: uid, postRequestId: pid } },
    });
    if (existing) {
      await this.prisma.userSavedExternalPost.delete({ where: { id: existing.id } });
      return { saved: false };
    }
    await this.prisma.userSavedExternalPost.create({
      data: { userId: uid, postRequestId: pid },
    });
    return { saved: true };
  }

  async listSavedPosts(userId: string) {
    const uid = userId.trim();
    if (!uid) return [];

    const schoolId = await this.schoolIdForUser(uid);
    if (!schoolId) return [];

    const rows = await this.prisma.userSavedExternalPost.findMany({
      where: {
        userId: uid,
        postRequest: { schoolId, ...publicPostWhere },
      },
      include: { postRequest: { include: postInclude } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return rows.map((r) => ({
      ...r.postRequest,
      savedAt: r.createdAt,
    }));
  }
}
