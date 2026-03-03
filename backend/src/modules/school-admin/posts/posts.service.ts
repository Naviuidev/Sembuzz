import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SchoolAdminPostsService {
  constructor(private prisma: PrismaService) {}

  async findAllForSchool(schoolId: string) {
    return this.prisma.event.findMany({
      where: { schoolId },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        subCategoryAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, schoolId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, schoolId },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        subCategoryAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!event) {
      throw new NotFoundException('Post not found');
    }
    return event;
  }

  async delete(id: string, schoolId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, schoolId },
    });
    if (!event) {
      throw new NotFoundException('Post not found');
    }
    await this.prisma.event.delete({ where: { id } });
    return { deleted: true };
  }

  async update(
    id: string,
    schoolId: string,
    data: {
      title?: string;
      description?: string;
      externalLink?: string;
      commentsEnabled?: boolean;
      imageUrls?: string[];
    },
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id, schoolId },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        subCategoryAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!event) {
      throw new NotFoundException('Post not found');
    }
    const updateData: {
      title?: string;
      description?: string;
      externalLink?: string | null;
      commentsEnabled?: boolean;
      imageUrls?: string | null;
    } = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.externalLink !== undefined) updateData.externalLink = data.externalLink || null;
    if (data.commentsEnabled !== undefined) updateData.commentsEnabled = data.commentsEnabled;
    if (data.imageUrls !== undefined) {
      const arr = Array.isArray(data.imageUrls) ? data.imageUrls.filter((u) => typeof u === 'string' && u.trim()) : [];
      updateData.imageUrls = arr.length > 0 ? JSON.stringify(arr) : null;
    }
    const updated = await this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        subCategoryAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    return updated;
  }
}
