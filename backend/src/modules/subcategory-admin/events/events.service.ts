import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import OpenAI from 'openai';
import { CreateEventDto } from './dto/create-event.dto';

export interface AnalyzeBannerResult {
  title: string;
  description: string;
  externalLink: string;
}

@Injectable()
export class EventsService {
  private openai: OpenAI | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async create(subCategoryAdminId: string, dto: CreateEventDto) {
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: subCategoryAdminId },
      select: { categoryId: true, schoolId: true },
    });
    if (!admin) {
      throw new ForbiddenException('Subcategory admin not found');
    }
    const imageUrlsJson = dto.imageUrls?.length
      ? JSON.stringify(dto.imageUrls)
      : null;
    return this.prisma.event.create({
      data: {
        subCategoryAdminId,
        subCategoryId: dto.subCategoryId,
        categoryId: admin.categoryId,
        schoolId: admin.schoolId,
        title: dto.title,
        description: dto.description ?? null,
        externalLink: dto.externalLink ?? null,
        commentsEnabled: dto.commentsEnabled ?? true,
        imageUrls: imageUrlsJson,
        status: 'pending',
      },
      include: {
        subCategory: { select: { id: true, name: true } },
      },
    });
  }

  async findPendingBySubCategoryAdmin(subCategoryAdminId: string) {
    return this.prisma.event.findMany({
      where: {
        subCategoryAdminId,
        status: 'pending',
      },
      include: {
        subCategory: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRevertedBySubCategoryAdmin(subCategoryAdminId: string) {
    return this.prisma.event.findMany({
      where: {
        subCategoryAdminId,
        status: 'reverted',
      },
      include: {
        subCategory: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findApprovedBySubCategoryAdmin(subCategoryAdminId: string) {
    return this.prisma.event.findMany({
      where: {
        subCategoryAdminId,
        status: 'approved',
      },
      include: {
        subCategory: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async analyzeBannerImage(imageBuffer: Buffer, mimeType: string): Promise<AnalyzeBannerResult> {
    if (!this.openai) {
      throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY in .env');
    }

    const base64 = imageBuffer.toString('base64');
    const mediaType = mimeType || 'image/jpeg';

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this banner/event image and extract or suggest:
1. title - A short, clear title for the event or content (one line).
2. description - A brief description (2-4 sentences). If no text is visible, describe what the image shows and suggest a generic description.
3. externalLink - If any URL or link is visible in the image, extract it. Otherwise return empty string "".

Respond ONLY with valid JSON in this exact format, no other text:
{"title":"...","description":"...","externalLink":"..."}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${base64}`,
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return { title: '', description: '', externalLink: '' };
    }

    try {
      const parsed = JSON.parse(content) as AnalyzeBannerResult;
      return {
        title: typeof parsed.title === 'string' ? parsed.title : '',
        description: typeof parsed.description === 'string' ? parsed.description : '',
        externalLink: typeof parsed.externalLink === 'string' ? parsed.externalLink : '',
      };
    } catch {
      return { title: '', description: '', externalLink: '' };
    }
  }
}
